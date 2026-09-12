import express from 'express';
import db, { updateRanks } from '../db.js';
import { requireAdmin } from '../auth.js';
import {
  startServerTimer,
  pauseServerTimer,
  resumeServerTimer,
  stopServerTimer,
  broadcastSessionState,
  broadcastScoreboard,
  getIO
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
  const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Game session not found' });
  }

  let question = null;
  if (session.current_question_id) {
    question = db.prepare('SELECT * FROM questions WHERE id = ?').get(session.current_question_id);
    if (question) {
      try {
        question.options = JSON.parse(question.options_json || '[]');
      } catch {
        question.options = [];
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
      const firstQ = db.prepare('SELECT id FROM questions WHERE game = ? AND round = 1 ORDER BY created_at ASC LIMIT 1').get(game);
      db.prepare(`
        UPDATE game_sessions 
        SET round = 1, current_question_id = ?, status = 'RUNNING', is_paused = 0, timer_remaining = ?
        WHERE game = ?
      `).run(firstQ ? firstQ.id : null, defaultTimer, game);

      startServerTimer(game, defaultTimer);
      break;
    }

    case 'START_ROUND': {
      const r = Number(round) || 1;
      const firstQ = db.prepare('SELECT id FROM questions WHERE game = ? AND round = ? ORDER BY created_at ASC LIMIT 1').get(game, r);
      db.prepare(`
        UPDATE game_sessions 
        SET round = ?, current_question_id = ?, status = 'READY', is_paused = 0, timer_remaining = ?
        WHERE game = ?
      `).run(r, firstQ ? firstQ.id : null, defaultTimer, game);
      broadcastSessionState(game);
      break;
    }

    case 'SET_QUESTION': {
      if (!questionId) return res.status(400).json({ success: false, message: 'Question ID required' });
      const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
      if (!q) return res.status(404).json({ success: false, message: 'Question not found' });

      const duration = q.time_limit || defaultTimer;
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

    case 'START_TIMER': {
      const duration = Number(timerDuration) || session.timer_remaining || defaultTimer;
      startServerTimer(game, duration);
      break;
    }

    case 'PAUSE_TIMER': {
      pauseServerTimer(game);
      break;
    }

    case 'RESUME_TIMER': {
      resumeServerTimer(game);
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

  const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(team.game);
  if (!session || (session.status !== 'RUNNING' && session.status !== 'READY')) {
    return res.status(400).json({ success: false, message: 'Game is not currently active for submissions or time has expired' });
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

  // Validate answer
  const isCorrect = String(answer).trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase();

  const scoring = db.prepare('SELECT * FROM scoring_settings WHERE game = ?').get(team.game);
  const basePointsSetting = question.base_points || (scoring ? scoring.base_points : 10);
  const negativePointsSetting = scoring ? scoring.negative_points : 0;

  let basePoints = 0;
  let timeBonus = 0;
  let totalPoints = 0;

  if (isCorrect) {
    basePoints = basePointsSetting;
    timeBonus = calculateTimeBonus(team.game, responseTime);
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
    team.game,
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
  `).run(newScore, `ROUND ${question.round}`, teamId);

  updateRanks(team.game);
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

  // Stop active timer
  stopServerTimer('pictionary');

  const scoring = db.prepare("SELECT * FROM scoring_settings WHERE game = 'pictionary'").get();
  const basePointsSetting = question.base_points || (scoring ? scoring.base_points : 10);
  const timeTaken = Number(responseTime) || 15.0;

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
  db.prepare('UPDATE teams SET score = ?, status = ? WHERE id = ?')
    .run(newScore, `ROUND ${question.round}`, teamId);

  updateRanks('pictionary');
  broadcastScoreboard();

  return res.json({
    success: true,
    message: `Pictionary evaluated: ${isCorrect ? 'CORRECT' : 'WRONG'} (+${totalPoints} pts)`,
    totalPoints,
    newScore
  });
});

// ADMIN LIVE MONITOR STATS
router.get('/monitor/:game', (req, res) => {
  const { game } = req.params;
  const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
  if (!session || !session.current_question_id) {
    return res.json({
      success: true,
      currentQuestion: null,
      answersCount: 0,
      totalTeams: 0,
      fastestAnswer: null,
      correctCount: 0,
      wrongCount: 0,
      leader: null
    });
  }

  const totalTeams = db.prepare('SELECT count(*) as count FROM teams WHERE game = ?').get(game).count;
  const answers = db.prepare(`
    SELECT a.*, t.team_name 
    FROM answers a
    JOIN teams t ON a.team_id = t.id
    WHERE a.question_id = ?
    ORDER BY a.response_time ASC
  `).all(session.current_question_id);

  const correctCount = answers.filter(a => a.is_correct === 1).length;
  const wrongCount = answers.filter(a => a.is_correct === 0).length;
  const fastest = answers.find(a => a.is_correct === 1) || answers[0] || null;
  const leader = db.prepare('SELECT team_name, score FROM teams WHERE game = ? ORDER BY score DESC, rank ASC LIMIT 1').get(game);

  return res.json({
    success: true,
    answersCount: answers.length,
    totalTeams,
    fastestAnswer: fastest ? { teamName: fastest.team_name, time: fastest.response_time } : null,
    correctCount,
    wrongCount,
    leader: leader ? `${leader.team_name} – ${leader.score} Pts` : 'N/A',
    recentAnswers: answers.slice(0, 10)
  });
});

export default router;
