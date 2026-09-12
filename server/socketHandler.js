import db, { updateRanks } from './db.js';

let ioInstance = null;
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
      // Send current session state
      const session = db.prepare('SELECT * FROM game_sessions WHERE game = ?').get(game);
      if (session) {
        socket.emit('session_state', session);
      }
    });

    // Pictionary drawing events
    socket.on('draw_stroke', (strokeData) => {
      socket.to('game_pictionary').emit('draw_stroke', strokeData);
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
    const teams = db.prepare('SELECT * FROM teams ORDER BY score DESC, rank ASC').all();
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
      question = db.prepare('SELECT * FROM questions WHERE id = ?').get(session.current_question_id);
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

      if (ioInstance) {
        ioInstance.to(`game_${game}`).emit('timer_tick', { game, remaining: 0, status: 'TIME_UP' });
        ioInstance.to(`game_${game}`).emit('time_up', { game });
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
    SET is_paused = 1, status = 'PAUSED'
    WHERE game = ?
  `).run(game);
  broadcastSessionState(game);
  if (ioInstance) {
    ioInstance.to(`game_${game}`).emit('timer_paused', { game });
  }
}

export function resumeServerTimer(game) {
  const session = db.prepare('SELECT timer_remaining FROM game_sessions WHERE game = ?').get(game);
  const remaining = session ? session.timer_remaining : 30;
  if (remaining > 0) {
    startServerTimer(game, remaining);
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
