import express from 'express';
import db, { updateRanks } from '../db.js';
import { requireAdmin, checkIsAdmin } from '../auth.js';
import { syncToMySQL } from '../mysqlSync.js';
import {
  startServerTimer,
  pauseServerTimer,
  resumeServerTimer,
  stopServerTimer,
  broadcastSessionState,
  broadcastScoreboard,
  getIO,
  liveTeamQuestions
} from '../socketHandler.js';

const router = express.Router();

// Helper to calculate time bonus according to active scoring settings
function calculateTimeBonus(game, responseTimeSec) {
  const scoring = db.prepare('SELECT * FROM scoring_settings WHERE game = ?').get(game);
  if (!scoring) return 0;

  if (responseTimeSec <= 5) return scoring.tier_0_5;
  if (responseTimeSec <= 10) return scoring.tier_6_10;
  if (responseTimeSec <= 15) return scoring.tier_11_15;
  if (responseTimeSec <= 20) return scoring.tier_16_20;
  if (responseTimeSec <= 25) return scoring.tier_21_25;
  if (responseTimeSec <= 30) return scoring.tier_26_30;
  return 0;
}

// GET current session state
router.get('/session/:game', (req, res) => {
  const { game } = req.params;
  const isAdmin = checkIsAdmin(req);
  const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Game session not found' });
  }

  let question = null;
  // Anti-cheating: Non-admin can only receive active question if session is RUNNING
  if ((isAdmin || session.status === 'RUNNING') && session.current_question_id) {
    question = db.prepare('SELECT * FROM questions WHERE id = ?').get(session.current_question_id);
    if (question) {
      try {
        question.options = JSON.parse(question.options_json || '[]');
      } catch {
        question.options = [];
      }
      if (!isAdmin) {
        delete question.correct_answer;
        if (question.game === 'pictionary') {
          question.question = 'Engineering Concept (Hidden from Participants)';
        }
      }
    }
  }

  let team = null;
  if (session.current_team_id) {
    team = db.prepare('SELECT * FROM teams WHERE id = ?').get(session.current_team_id);
  }

  return res.json({ success: true, session, question, team });
});


// ADMIN Game Control
router.post('/control/:game', requireAdmin, (req, res) => {
  const { game } = req.params;
  const { action, round, questionId, teamId, timerDuration } = req.body;

  const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Game session not found' });
  }

  const scoring = db.prepare('SELECT * FROM scoring_settings WHERE game = ?').get(game);
  const defaultTimer = scoring ? scoring.timer_duration : 30;

  switch (action) {
    case 'START_GAME': {
      const targetRound = Number(round) || Number(session.round) || 1;
      const duration = Number(timerDuration) || defaultTimer;

      // If round was previously STOPPED or PAUSED and admin starts the same round, resume seamlessly
      if ((session.status === 'STOPPED' || session.status === 'PAUSED') && Number(session.round) === targetRound) {
        db.prepare(`
          UPDATE game_sessions 
          SET status = 'RUNNING', is_paused = 0
          WHERE game = ?
        `).run(game);
        resumeServerTimer(game);
        const io = getIO();
        if (io) {
          io.to(`game_${game}`).emit('round_resumed', { game, round: targetRound });
          io.emit('round_resumed', { game, round: targetRound });
        }
        broadcastSessionState(game);
        break;
      }

      const firstQ = db.prepare('SELECT id FROM questions WHERE game = ? AND round = ? ORDER BY created_at ASC LIMIT 1').get(game, targetRound);
      const startedAt = new Date().toISOString();
      db.prepare(`
        UPDATE game_sessions 
        SET round = ?, current_question_id = ?, status = 'RUNNING', is_paused = 0, timer_remaining = ?, started_at = ?
        WHERE game = ?
      `).run(targetRound, firstQ ? firstQ.id : null, duration, startedAt, game);

      startServerTimer(game, duration);
      const io = getIO();
      if (io) {
        io.to(`game_${game}`).emit('round_resumed', { game, round: targetRound });
        io.emit('round_resumed', { game, round: targetRound });
      }
      break;
    }

    case 'SET_TIMER_DURATION': {
      const newDuration = Math.max(5, Math.min(300, Number(timerDuration) || 30));
      db.prepare('UPDATE scoring_settings SET timer_duration = ? WHERE game = ?').run(newDuration, game);
      if (session.status !== 'RUNNING') {
        db.prepare('UPDATE game_sessions SET timer_remaining = ? WHERE game = ?').run(newDuration, game);
      }
      broadcastSessionState(game);
      const io = getIO();
      if (io) {
        io.to(`game_${game}`).emit('timer_tick', { game, remaining: newDuration, status: session.status });
      }
      break;
    }

    case 'START_ROUND': {
      const r = Number(round) || 1;
      const firstQ = db.prepare('SELECT id FROM questions WHERE game = ? AND round = ? ORDER BY created_at ASC LIMIT 1').get(game, r);
      const duration = Number(timerDuration) || defaultTimer;
      db.prepare(`
        UPDATE game_sessions 
        SET round = ?, current_question_id = ?, status = 'READY', is_paused = 0, timer_remaining = ?
        WHERE game = ?
      `).run(r, firstQ ? firstQ.id : null, duration, game);
      broadcastSessionState(game);
      break;
    }

    case 'SET_QUESTION': {
      if (!questionId) return res.status(400).json({ success: false, message: 'Question ID required' });
      const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
      if (!q) return res.status(404).json({ success: false, message: 'Question not found' });

      const duration = Number(timerDuration) || q.time_limit || defaultTimer;
      db.prepare(`
        UPDATE game_sessions 
        SET current_question_id = ?, round = ?, timer_remaining = ?, is_paused = 0
        WHERE game = ?
      `).run(q.id, q.round, duration, game);

      broadcastSessionState(game);
      break;
    }

    case 'SET_TEAM': {
      db.prepare('UPDATE game_sessions SET current_team_id = ? WHERE game = ?').run(teamId || null, game);
      broadcastSessionState(game);
      break;
    }

    case 'START_PICTIONARY_TURN': {
      const activeTeamId = teamId || session.current_team_id;
      const activeQuestionId = questionId || session.current_question_id;
      const duration = Number(timerDuration) || 30;

      db.prepare(`
        UPDATE game_sessions 
        SET current_team_id = ?, current_question_id = ?, timer_remaining = ?, status = 'RUNNING', is_paused = 0
        WHERE game = 'pictionary'
      `).run(activeTeamId, activeQuestionId, duration);

      const io = getIO();
      if (io) {
        io.to('game_pictionary').emit('clear_canvas');
        io.to('game_pictionary').emit('pictionary_turn_started', {
          teamId: activeTeamId,
          duration
        });
      }

      startServerTimer('pictionary', duration);
      broadcastSessionState('pictionary');
      break;
    }

    case 'START_TIMER': {
      const duration = Number(timerDuration) || session.timer_remaining || defaultTimer;
      startServerTimer(game, duration);
      break;
    }

    case 'PAUSE_TIMER': {
      pauseServerTimer(game);
      break;
    }

    case 'STOP_ROUND':
    case 'STOP_GAME': {
      // Temporarily stop the round questions & pause the timer for remaining questions
      pauseServerTimer(game);
      db.prepare("UPDATE game_sessions SET status = 'STOPPED', is_paused = 1 WHERE game = ?").run(game);
      const io = getIO();
      if (io) {
        io.to(`game_${game}`).emit('round_stopped', { 
          game, 
          round: session.round,
          message: `Round ${session.round} stopped by Admin. Standby for remaining questions.` 
        });
        io.emit('round_stopped', { game, round: session.round });
      }
      broadcastSessionState(game);
      break;
    }

    case 'RESUME_ROUND':
    case 'RESUME_GAME':
    case 'RESUME_TIMER': {
      // Resume the round so teams can continue with remaining questions
      db.prepare("UPDATE game_sessions SET status = 'RUNNING', is_paused = 0 WHERE game = ?").run(game);
      resumeServerTimer(game);
      const io = getIO();
      if (io) {
        io.to(`game_${game}`).emit('round_resumed', { 
          game, 
          round: session.round,
          message: `Round ${session.round} resumed! Continue answering remaining questions.` 
        });
        io.emit('round_resumed', { game, round: session.round });
      }
      broadcastSessionState(game);
      break;
    }

    case 'FINALIZE_ROUND':
    case 'STOP_TIMER':
    case 'STOP_PICTIONARY_TURN': {
      stopServerTimer(game);
      db.prepare("UPDATE game_sessions SET status = 'TIME_UP', timer_remaining = 0, is_paused = 0 WHERE game = ?").run(game);
      updateRanks(game);
      broadcastScoreboard();
      const io = getIO();
      if (io) {
        io.to(`game_${game}`).emit('timer_tick', { game, remaining: 0, status: 'TIME_UP' });
        io.to(`game_${game}`).emit('time_up', { game });
        io.emit('brain_round_finished', {
          game,
          status: 'TIME_UP',
          message: 'Round finalized! Points calculated and dashboard updated.'
        });
      }
      broadcastSessionState(game);
      break;
    }

    case 'NEXT_QUESTION': {
      const currentQ = session.current_question_id 
        ? db.prepare('SELECT * FROM questions WHERE id = ?').get(session.current_question_id)
        : null;

      const currentRound = currentQ ? currentQ.round : session.round;
      // Find questions in this round ordered by created_at
      const questionsInRound = db.prepare('SELECT id FROM questions WHERE game = ? AND round = ? ORDER BY created_at ASC').all(game, currentRound);
      
      let nextId = null;
      if (currentQ) {
        const idx = questionsInRound.findIndex(q => q.id === currentQ.id);
        if (idx >= 0 && idx + 1 < questionsInRound.length) {
          nextId = questionsInRound[idx + 1].id;
        }
      } else if (questionsInRound.length > 0) {
        nextId = questionsInRound[0].id;
      }

      if (nextId) {
        const nextQ = db.prepare('SELECT * FROM questions WHERE id = ?').get(nextId);
        const duration = nextQ.time_limit || defaultTimer;
        db.prepare(`
          UPDATE game_sessions 
          SET current_question_id = ?, timer_remaining = ?, status = 'READY', is_paused = 0
          WHERE game = ?
        `).run(nextId, duration, game);
        startServerTimer(game, duration);
      } else {
        stopServerTimer(game);
        db.prepare("UPDATE game_sessions SET status = 'ROUND_ENDED' WHERE game = ?").run(game);
      }
      broadcastSessionState(game);
      break;
    }

    case 'RESTART_QUESTION': {
      const q = session.current_question_id 
        ? db.prepare('SELECT time_limit FROM questions WHERE id = ?').get(session.current_question_id)
        : null;
      const duration = (q && q.time_limit) || defaultTimer;
      startServerTimer(game, duration);
      break;
    }

    case 'END_ROUND': {
      stopServerTimer(game);
      db.prepare("UPDATE game_sessions SET status = 'ROUND_ENDED' WHERE game = ?").run(game);
      broadcastSessionState(game);
      break;
    }

    case 'END_GAME': {
      stopServerTimer(game);
      db.prepare("UPDATE game_sessions SET status = 'ENDED' WHERE game = ?").run(game);
      // Update team statuses
      db.prepare("UPDATE teams SET status = 'COMPLETED' WHERE game = ?").run(game);
      updateRanks(game);
      broadcastScoreboard();
      broadcastSessionState(game);
      break;
    }

    case 'RESET_GAME': {
      stopServerTimer(game);
      const targetRound = Number(round) || 1;
      const firstQ = db.prepare('SELECT id FROM questions WHERE game = ? AND round = ? ORDER BY created_at ASC LIMIT 1').get(game, targetRound);
      db.prepare(`
        UPDATE game_sessions 
        SET status = 'IDLE', round = ?, current_question_id = ?, is_paused = 0, started_at = null, timer_remaining = ?
        WHERE game = ?
      `).run(targetRound, firstQ ? firstQ.id : null, defaultTimer, game);
      broadcastSessionState(game);
      break;
    }

    default:
      return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
  }

  return res.json({ success: true, message: `Action ${action} executed successfully` });
});

// SUBMIT ANSWER (Player / Arena)
router.post('/submit-answer', (req, res) => {
  const { teamId, questionId, answer } = req.body;
  if (!teamId || !questionId || answer === undefined) {
    return res.status(400).json({ success: false, message: 'teamId, questionId, and answer are required' });
  }

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
  if (!question) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  const activeGame = question.game || (team.game === 'both' ? 'brain' : team.game);

  // Security & game integrity: Team must be registered for this game
  if (team.game !== 'both' && team.game !== activeGame) {
    return res.status(403).json({ 
      success: false, 
      message: `Squad "${team.team_name}" is registered only for ${team.game === 'brain' ? "Engineer's Brain" : "Engineering Pictionary"} and cannot participate in ${activeGame}.` 
    });
  }

  const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(activeGame);
  if (!session || session.status !== 'RUNNING') {
    const isStopped = session && (session.status === 'STOPPED' || session.status === 'PAUSED');
    return res.status(400).json({ 
      success: false, 
      message: isStopped 
        ? 'The round is currently stopped by the Admin. Submissions are temporarily locked until the round is resumed.'
        : 'Game has not started or is not currently active for submissions' 
    });
  }


  // Anti-cheating: Check if team already answered this question
  const existingAnswer = db.prepare('SELECT id FROM answers WHERE team_id = ? AND question_id = ?').get(teamId, questionId);
  if (existingAnswer) {
    return res.status(400).json({ success: false, message: 'You have already submitted an answer for this question!' });
  }

  // Calculate Response Time (seconds)
  const totalLimit = question.time_limit || 30;
  const remaining = session.timer_remaining !== undefined ? session.timer_remaining : 0;
  let responseTime = Math.max(0.5, totalLimit - remaining);
  responseTime = Number(responseTime.toFixed(1));

  // Validate answer (flexible matching for exact text, letter prefix like "B) Resistor", or option letter)
  const cleanAns = String(answer).trim().toLowerCase();
  const cleanCorrect = String(question.correct_answer).trim().toLowerCase();
  let isCorrect = cleanAns === cleanCorrect;

  if (!isCorrect) {
    try {
      const opts = JSON.parse(question.options_json || '[]');
      opts.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx).toLowerCase(); // a, b, c, d
        const cleanOpt = String(opt).trim().toLowerCase();
        
        const isOptCorrect = cleanCorrect === cleanOpt || cleanCorrect === letter || cleanCorrect.startsWith(`${letter})`) || cleanCorrect.startsWith(`${letter} `);
        if (isOptCorrect) {
          if (cleanAns === cleanOpt || cleanAns === letter || cleanAns.startsWith(`${letter})`) || cleanAns.startsWith(`${letter} `)) {
            isCorrect = true;
          }
        }
      });
    } catch {}
  }

  const scoring = db.prepare('SELECT * FROM scoring_settings WHERE game = ?').get(activeGame);
  const basePointsSetting = question.base_points || (scoring ? scoring.base_points : 10);
  const negativePointsSetting = scoring ? scoring.negative_points : 0;

  let basePoints = 0;
  let timeBonus = 0;
  let totalPoints = 0;

  if (isCorrect) {
    basePoints = basePointsSetting;
    timeBonus = calculateTimeBonus(activeGame, responseTime);
    totalPoints = basePoints + timeBonus;
  } else {
    totalPoints = -negativePointsSetting;
  }

  const answerId = `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO answers (id, team_id, question_id, game, round, answer_text, is_correct, response_time, base_points, time_bonus, total_points, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    answerId,
    teamId,
    questionId,
    activeGame,
    question.round,
    String(answer),
    isCorrect ? 1 : 0,
    responseTime,
    basePoints,
    timeBonus,
    totalPoints,
    new Date().toISOString()
  );

  // Update team score
  const newScore = Math.max(0, team.score + totalPoints);
  db.prepare(`
    UPDATE teams 
    SET score = ?, status = ?
    WHERE id = ?
  `).run(newScore, isCorrect ? 'ANSWERED_CORRECT' : 'ANSWERED_WRONG', teamId);

  syncToMySQL(
    `INSERT INTO answers (id, team_id, question_id, game, round, answer_text, is_correct, response_time, base_points, time_bonus, total_points, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [answerId, teamId, questionId, activeGame, question.round, String(answer), isCorrect ? 1 : 0, responseTime, basePoints, timeBonus, totalPoints, new Date().toISOString()]
  );
  syncToMySQL(
    'UPDATE teams SET score = ?, status = ? WHERE id = ?',
    [newScore, isCorrect ? 'ANSWERED_CORRECT' : 'ANSWERED_WRONG', teamId]
  );

  if (team.game === 'both') {
    updateRanks('brain');
    updateRanks('pictionary');
  } else {
    updateRanks(team.game);
  }
  broadcastScoreboard();

  // Notify socket clients about live answer for admin monitor
  const io = getIO();
  if (io) {
    io.emit('new_answer_submitted', {
      game: team.game,
      teamId,
      teamName: team.team_name,
      isCorrect,
      responseTime,
      totalPoints
    });
  }

  // Auto-stop detection: When all participating squads have submitted all questions in the round,
  // automatically stop the game clock, calculate scores, and update the Live Dashboard!
  if (activeGame === 'brain') {
    checkAndAutoStopBrainRoundIfAllSubmitted(session.round || 1);
  }

  return res.json({
    success: true,
    isCorrect,
    correctAnswer: question.correct_answer,
    responseTime,
    basePoints,
    timeBonus,
    totalPoints,
    newTeamScore: newScore
  });
});

// Helper function: check if all participating squads have submitted all questions in the current round
export function checkAndAutoStopBrainRoundIfAllSubmitted(currentRound = 1) {
  try {
    const session = db.prepare("SELECT * FROM game_sessions WHERE game = 'brain'").get();
    if (!session || (session.status !== 'RUNNING' && session.status !== 'READY')) {
      return false;
    }

    const roundQuestions = db.prepare('SELECT id FROM questions WHERE game = ? AND round = ?').all('brain', currentRound);
    const totalQCount = roundQuestions.length;
    if (totalQCount === 0) return false;

    const qIds = roundQuestions.map(q => q.id);
    const placeholders = qIds.map(() => '?').join(',');

    // Teams that have answered at least one question in this round
    const activeTeams = db.prepare(`
      SELECT DISTINCT team_id 
      FROM answers 
      WHERE question_id IN (${placeholders})
    `).all(...qIds);

    if (activeTeams.length === 0) return false;

    // Check if every participating team has answered all questions in this round
    let allFinished = true;
    for (const at of activeTeams) {
      const countRow = db.prepare(`
        SELECT COUNT(DISTINCT question_id) as cnt 
        FROM answers 
        WHERE team_id = ? AND question_id IN (${placeholders})
      `).get(at.team_id, ...qIds);

      if (!countRow || countRow.cnt < totalQCount) {
        allFinished = false;
        break;
      }
    }

    if (allFinished) {
      console.log(`[Auto-Stop] All participating teams (${activeTeams.length}) have submitted all ${totalQCount} questions! Auto-stopping round, calculating scores, and updating live dashboard.`);
      stopServerTimer('brain');
      db.prepare("UPDATE game_sessions SET status = 'TIME_UP', timer_remaining = 0 WHERE game = 'brain'").run();
      updateRanks('brain');
      updateRanks('pictionary');
      broadcastScoreboard();

      const io = getIO();
      if (io) {
        io.to('game_brain').emit('timer_tick', { game: 'brain', remaining: 0, status: 'TIME_UP' });
        io.to('game_brain').emit('time_up', { game: 'brain' });
        io.emit('brain_round_finished', {
          game: 'brain',
          status: 'TIME_UP',
          allSubmitted: true,
          message: 'All squads have submitted all questions! Game stopped, scores calculated, and live dashboard updated.'
        });
      }
      broadcastSessionState('brain');
      return true;
    }
  } catch (err) {
    console.error('Error in checkAndAutoStopBrainRoundIfAllSubmitted:', err);
  }
  return false;
}

// FINISH SQUAD ROUND (Player / Arena voluntary finish or submission completion)
router.post('/finish-squad-round', (req, res) => {
  const { teamId, game = 'brain' } = req.body;
  if (!teamId) {
    return res.status(400).json({ success: false, message: 'teamId is required' });
  }

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Game session not found' });
  }

  updateRanks(game);
  broadcastScoreboard();

  const isStopped = checkAndAutoStopBrainRoundIfAllSubmitted(session.round || 1);

  return res.json({
    success: true,
    allSubmitted: isStopped,
    message: isStopped
      ? 'All squads have submitted! Round stopped, points calculated, and live dashboard updated.'
      : 'Squad answers recorded! Live leaderboard recalculated.'
  });
});

// JUDGE PICTIONARY (Admin / Judge)
router.post('/judge-pictionary', requireAdmin, (req, res) => {
  const { teamId, questionId, isCorrect, responseTime } = req.body;
  if (!teamId || !questionId || isCorrect === undefined) {
    return res.status(400).json({ success: false, message: 'teamId, questionId, and isCorrect are required' });
  }

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
  if (!team || !question) {
    return res.status(404).json({ success: false, message: 'Team or Question not found' });
  }

  const timeTaken = Math.min(30, Math.max(1, Number(responseTime) || 15.0));

  // Stop active timer & freeze session
  stopServerTimer('pictionary');
  const remainingSec = Math.max(0, 30 - Math.round(timeTaken));
  db.prepare("UPDATE game_sessions SET status = 'ROUND_ENDED', timer_remaining = ? WHERE game = 'pictionary'")
    .run(remainingSec);

  const scoring = db.prepare("SELECT * FROM scoring_settings WHERE game = 'pictionary'").get();
  const basePointsSetting = question.base_points || (scoring ? scoring.base_points : 10);

  let basePoints = 0;
  let timeBonus = 0;
  let totalPoints = 0;

  if (isCorrect) {
    basePoints = basePointsSetting;
    timeBonus = calculateTimeBonus('pictionary', timeTaken);
    totalPoints = basePoints + timeBonus;
  }

  const answerId = `ans-pic-${Date.now()}`;
  db.prepare(`
    INSERT INTO answers (id, team_id, question_id, game, round, answer_text, is_correct, response_time, base_points, time_bonus, total_points, created_at)
    VALUES (?, ?, ?, 'pictionary', ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    answerId,
    teamId,
    questionId,
    question.round,
    isCorrect ? 'GUESSED_CORRECT' : 'INCORRECT_OR_PASSED',
    isCorrect ? 1 : 0,
    timeTaken,
    basePoints,
    timeBonus,
    totalPoints,
    new Date().toISOString()
  );

  const newScore = team.score + totalPoints;
  // If team was only registered for brain, mark them as 'both' so they appear on pictionary leaderboard
  const updatedGame = (team.game === 'brain' || team.game === 'both') ? 'both' : 'pictionary';
  db.prepare('UPDATE teams SET score = ?, status = ?, game = ? WHERE id = ?')
    .run(newScore, `ROUND ${question.round}`, updatedGame, teamId);

  syncToMySQL(
    'UPDATE teams SET score = ?, status = ?, game = ? WHERE id = ?',
    [newScore, `ROUND ${question.round}`, updatedGame, teamId]
  );

  updateRanks('pictionary');
  updateRanks('brain');
  broadcastScoreboard();
  broadcastSessionState('pictionary');

  const io = getIO();
  if (io) {
    const payload = {
      teamId,
      teamName: team.team_name,
      isCorrect,
      basePoints,
      timeBonus,
      totalPoints,
      newScore,
      responseTime: timeTaken,
      concept: question.correct_answer
    };
    io.to('game_pictionary').emit('pictionary_round_finished', payload);
    io.emit('pictionary_round_finished', payload);
    io.emit('scoreboard_updated', db.prepare('SELECT * FROM teams ORDER BY score DESC, rank ASC').all());
  }

  return res.json({
    success: true,
    message: isCorrect 
      ? `Round finished! ${team.team_name} guessed correctly in ${timeTaken}s (+${totalPoints} pts)`
      : `Round ended for ${team.team_name} (Pass / 0 pts)`,
    totalPoints,
    basePoints,
    timeBonus,
    responseTime: timeTaken,
    newScore
  });
});

// ADMIN LIVE MONITOR STATS (Tracks all teams, current question number, and live points)
router.get('/monitor/:game', (req, res) => {
  const { game } = req.params;
  const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
  const currentRound = session ? (session.round || 1) : 1;

  // Questions in this round
  const roundQuestions = db.prepare('SELECT id, question, round FROM questions WHERE game = ? AND round = ? ORDER BY created_at ASC').all(game, currentRound);
  const totalQuestions = roundQuestions.length;
  const qIds = roundQuestions.map(q => q.id);
  const placeholders = qIds.length > 0 ? qIds.map(() => '?').join(',') : null;

  // All verified teams participating in this game
  const participatingTeams = db.prepare(`
    SELECT id, team_name, captain, score, rank, status, game
    FROM teams 
    WHERE (game = ? OR game = 'both') AND registration_status = 'VERIFIED'
    ORDER BY score DESC, rank ASC
  `).all(game);

  // Map each team's live question and points progress
  const teamsProgress = participatingTeams.map((t) => {
    let answeredCount = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let roundPoints = 0;
    let lastActivity = null;
    let answeredQuestionIds = [];

    if (placeholders && qIds.length > 0) {
      const teamAnswers = db.prepare(`
        SELECT question_id, is_correct, total_points, created_at 
        FROM answers 
        WHERE team_id = ? AND question_id IN (${placeholders})
        ORDER BY created_at ASC
      `).all(t.id, ...qIds);

      answeredCount = teamAnswers.length;
      correctCount = teamAnswers.filter(a => a.is_correct === 1).length;
      wrongCount = teamAnswers.filter(a => a.is_correct === 0).length;
      roundPoints = teamAnswers.reduce((sum, a) => sum + (Number(a.total_points) || 0), 0);
      answeredQuestionIds = teamAnswers.map(a => a.question_id);
      if (teamAnswers.length > 0) {
        lastActivity = teamAnswers[teamAnswers.length - 1].created_at;
      }
    }

    const isCompleted = totalQuestions > 0 && answeredCount >= totalQuestions;
    
    // Live question number: from socket heartbeat or next unanswered question
    let currentQuestionNum = isCompleted 
      ? totalQuestions 
      : Math.min(totalQuestions > 0 ? totalQuestions : 1, answeredCount + 1);

    if (liveTeamQuestions && liveTeamQuestions[t.id] && !isCompleted) {
      currentQuestionNum = liveTeamQuestions[t.id];
    }

    return {
      id: t.id,
      team_name: t.team_name,
      captain: t.captain,
      score: t.score || 0,
      roundPoints,
      rank: t.rank || 1,
      currentQuestionNum,
      totalQuestions: totalQuestions || 6,
      answeredCount,
      remainingCount: Math.max(0, (totalQuestions || 6) - answeredCount),
      correctCount,
      wrongCount,
      isCompleted,
      status: isCompleted ? 'COMPLETED' : (answeredCount > 0 ? 'SOLVING' : 'WAITING'),
      lastActivity
    };
  });

  // Recent answers across all teams for the active question or round
  let answers = [];
  if (session && session.current_question_id) {
    answers = db.prepare(`
      SELECT a.*, t.team_name 
      FROM answers a
      JOIN teams t ON a.team_id = t.id
      WHERE a.question_id = ?
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(session.current_question_id);
  } else if (placeholders && qIds.length > 0) {
    answers = db.prepare(`
      SELECT a.*, t.team_name 
      FROM answers a
      JOIN teams t ON a.team_id = t.id
      WHERE a.question_id IN (${placeholders})
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(...qIds);
  }

  const leader = participatingTeams[0] ? `${participatingTeams[0].team_name} – ${participatingTeams[0].score} Pts` : 'N/A';
  const completedCount = teamsProgress.filter(t => t.isCompleted).length;
  const activeCount = teamsProgress.filter(t => t.answeredCount > 0 && !t.isCompleted).length;

  return res.json({
    success: true,
    round: currentRound,
    totalQuestions: totalQuestions || 6,
    totalTeams: participatingTeams.length,
    activeTeamsCount: activeCount,
    completedTeamsCount: completedCount,
    leader,
    teamsProgress,
    recentAnswers: answers,
    session: session ? {
      game: session.game,
      round: session.round,
      status: session.status,
      timer_remaining: session.timer_remaining,
      timer_started_at: session.timer_started_at,
      started_at: session.started_at,
      is_paused: session.is_paused,
      current_question_id: session.current_question_id
    } : null
  });
});

export default router;
