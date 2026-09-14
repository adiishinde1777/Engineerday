import db, { updateRanks } from './db.js';

let ioInstance = null;
export const liveTeamQuestions = {};
const activeTimers = {
  brain: null,
  pictionary: null
};

export function setupSocketIO(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`[Socket] Client connected: ${socket.id}`);

    // Join game room
    socket.on('join_game', (game) => {
      socket.join(`game_${game}`);
      // Send current session state with question and team
      const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
      if (session) {
        let question = null;
        if (session.current_question_id) {
          const rawQ = db.prepare('SELECT * FROM questions WHERE id = ?').get(session.current_question_id);
          if (rawQ) {
            let opts = [];
            try {
              opts = typeof rawQ.options_json === 'string' ? JSON.parse(rawQ.options_json) : (rawQ.options_json || []);
            } catch {
              opts = [];
            }
            question = { ...rawQ, options: opts };
          }
        }
        let team = null;
        if (session.current_team_id) {
          team = db.prepare('SELECT * FROM teams WHERE id = ?').get(session.current_team_id);
        }
        socket.emit('session_state', { session, question, team });
      }
    });

    // Pictionary drawing events
    socket.on('draw_stroke', (strokeData) => {
      socket.to('game_pictionary').emit('draw_stroke', strokeData);
    });

    // Team question tracking (which question the squad is currently on)
    socket.on('team_viewing_question', ({ teamId, questionNumber }) => {
      if (teamId) {
        liveTeamQuestions[teamId] = Number(questionNumber) || 1;
        io.to('game_brain').emit('team_progress_update', {
          teamId,
          questionNumber: Number(questionNumber) || 1
        });
      }
    });

    socket.on('clear_canvas', () => {
      socket.to('game_pictionary').emit('clear_canvas');
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

export function broadcastScoreboard() {
  if (!ioInstance) return;
  try {
    const teams = db.prepare('SELECT * FROM teams WHERE (is_deleted = 0 OR is_deleted IS NULL) ORDER BY score DESC, rank ASC').all();
    ioInstance.emit('scoreboard_updated', teams);
  } catch (err) {
    console.error('Error broadcasting scoreboard:', err);
  }
}

export function broadcastSessionState(game) {
  if (!ioInstance) return;
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
    let question = null;
    if (session && session.current_question_id) {
      const rawQ = db.prepare('SELECT * FROM questions WHERE id = ?').get(session.current_question_id);
      if (rawQ) {
        let opts = [];
        try {
          opts = typeof rawQ.options_json === 'string' ? JSON.parse(rawQ.options_json) : (rawQ.options_json || []);
        } catch {
          opts = [];
        }
        question = { ...rawQ, options: opts };
      }
    }
    let team = null;
    if (session && session.current_team_id) {
      team = db.prepare('SELECT * FROM teams WHERE id = ?').get(session.current_team_id);
    }
    ioInstance.to(`game_${game}`).emit('session_state', {
      session,
      question,
      team
    });
    // Also emit globally for live monitors
    ioInstance.emit(`live_game_update_${game}`, {
      session,
      question,
      team
    });
  } catch (err) {
    console.error('Error broadcasting session state:', err);
  }
}

export function startServerTimer(game, duration) {
  if (activeTimers[game]) {
    clearInterval(activeTimers[game]);
    activeTimers[game] = null;
  }

  let remaining = duration;
  const startedAt = Date.now();

  db.prepare(`
    UPDATE game_sessions 
    SET timer_remaining = ?, timer_started_at = ?, is_paused = 0, status = 'RUNNING'
    WHERE game = ?
  `).run(remaining, startedAt, game);

  broadcastSessionState(game);

  activeTimers[game] = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(activeTimers[game]);
      activeTimers[game] = null;
      db.prepare(`
        UPDATE game_sessions 
        SET timer_remaining = 0, status = 'TIME_UP'
        WHERE game = ?
      `).run(game);

      // Recalculate ranks and update live scoreboard for dashboard
      updateRanks(game);
      broadcastScoreboard();

      if (ioInstance) {
        ioInstance.to(`game_${game}`).emit('timer_tick', { game, remaining: 0, status: 'TIME_UP' });
        ioInstance.to(`game_${game}`).emit('time_up', { game });
        ioInstance.emit('brain_round_finished', {
          game,
          status: 'TIME_UP',
          message: 'Round time expired! Points calculated and dashboard updated.'
        });
      }
      broadcastSessionState(game);
    } else {
      db.prepare(`
        UPDATE game_sessions 
        SET timer_remaining = ?
        WHERE game = ?
      `).run(remaining, game);

      if (ioInstance) {
        ioInstance.to(`game_${game}`).emit('timer_tick', { game, remaining, status: 'RUNNING' });
      }
    }
  }, 1000);
}

export function pauseServerTimer(game) {
  if (activeTimers[game]) {
    clearInterval(activeTimers[game]);
    activeTimers[game] = null;
  }
  db.prepare(`
    UPDATE game_sessions 
    SET is_paused = 1, status = 'STOPPED'
    WHERE game = ?
  `).run(game);
  broadcastSessionState(game);
  if (ioInstance) {
    ioInstance.to(`game_${game}`).emit('timer_paused', { game });
    ioInstance.to(`game_${game}`).emit('round_stopped', { game });
    ioInstance.emit('round_stopped', { game });
  }
}

export function resumeServerTimer(game) {
  const session = db.prepare('SELECT timer_remaining FROM game_sessions WHERE game = ?').get(game);
  const remaining = session && session.timer_remaining > 0 ? session.timer_remaining : 30;
  startServerTimer(game, remaining);
  if (ioInstance) {
    ioInstance.to(`game_${game}`).emit('round_resumed', { game });
    ioInstance.emit('round_resumed', { game });
  }
}

export function stopServerTimer(game) {
  if (activeTimers[game]) {
    clearInterval(activeTimers[game]);
    activeTimers[game] = null;
  }
  db.prepare(`
    UPDATE game_sessions 
    SET status = 'IDLE', is_paused = 0
    WHERE game = ?
  `).run(game);
  broadcastSessionState(game);
}

export function getIO() {
  return ioInstance;
}
