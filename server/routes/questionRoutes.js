import express from 'express';
import db from '../db.js';
import { requireAdmin, checkIsAdmin } from '../auth.js';
import { syncToMySQL } from '../mysqlSync.js';

const router = express.Router();

// GET questions
router.get('/', (req, res) => {
  const { game, round, type, search } = req.query;
  const isAdmin = checkIsAdmin(req);

  // Anti-cheating: Non-admin participants can ONLY receive questions when the session is RUNNING (or completed)
  // Preview mode is strictly restricted to authenticated administrators.
  if (!isAdmin) {
    if (!game || game === 'all') {
      return res.json({
        success: true,
        count: 0,
        questions: [],
        isLocked: true,
        message: 'Questions are strictly locked. Please specify an active game arena.'
      });
    }

    const session = db.prepare('SELECT status, round FROM game_sessions WHERE game = ?').get(game);
    const allowedStatuses = ['RUNNING', 'ROUND_ENDED', 'TIME_UP'];
    if (!session || !allowedStatuses.includes(session.status)) {
      return res.json({
        success: true,
        count: 0,
        questions: [],
        isLocked: true,
        message: 'Questions are strictly locked until the coordinator starts the round.'
      });
    }

    // When the game is running, players may only receive questions for the active round
    if (session.status === 'RUNNING' && round && Number(round) !== session.round) {
      return res.json({
        success: true,
        count: 0,
        questions: [],
        isLocked: true,
        message: `Questions for Round ${round} are locked. Active round is Round ${session.round}.`
      });
    }
  }

  let sql = 'SELECT * FROM questions WHERE (is_deleted = 0 OR is_deleted IS NULL)';
  const params = [];

  if (game && game !== 'all') {
    sql += ' AND game = ?';
    params.push(game);
  }
  if (round && round !== 'all') {
    sql += ' AND round = ?';
    params.push(Number(round));
  }
  if (type && type !== 'all') {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (search) {
    sql += ' AND (question LIKE ? OR correct_answer LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  sql += ' ORDER BY game ASC, round ASC, created_at ASC';
  
  let questions = [];
  try {
    questions = db.prepare(sql).all(...params);
  } catch (err) {
    if (err.message && err.message.includes('is_deleted')) {
      try {
        db.exec('ALTER TABLE questions ADD COLUMN is_deleted INTEGER DEFAULT 0;');
        db.exec('ALTER TABLE questions ADD COLUMN deleted_at TEXT;');
        questions = db.prepare(sql).all(...params);
      } catch {
        const fallbackSql = sql.replace('WHERE (is_deleted = 0 OR is_deleted IS NULL)', 'WHERE 1=1');
        questions = db.prepare(fallbackSql).all(...params);
      }
    } else {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Parse options_json and sanitize correct_answer & secret concepts for players
  const formatted = questions.map((q) => {
    let opts = [];
    try {
      opts = JSON.parse(q.options_json || '[]');
    } catch {
      opts = [];
    }
    const sanitized = { ...q, options: opts };
    if (!isAdmin) {
      delete sanitized.correct_answer;
      if (sanitized.game === 'pictionary') {
        sanitized.question = 'Engineering Concept (Hidden from Participants)';
      }
    }
    return sanitized;
  });

  return res.json({ success: true, count: formatted.length, questions: formatted });
});

// GET single question
router.get('/:id', (req, res) => {
  const isAdmin = checkIsAdmin(req);
  const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!q) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  if (!isAdmin) {
    const session = db.prepare('SELECT status FROM game_sessions WHERE game = ?').get(q.game);
    if (!session || session.status !== 'RUNNING') {
      return res.status(403).json({ success: false, message: 'Question is locked until game starts' });
    }
  }

  let opts = [];
  try {
    opts = JSON.parse(q.options_json || '[]');
  } catch {
    opts = [];
  }

  const sanitized = { ...q, options: opts };
  if (!isAdmin) {
    delete sanitized.correct_answer;
    if (sanitized.game === 'pictionary') {
      sanitized.question = 'Engineering Concept (Hidden from Participants)';
    }
  }
  return res.json({ success: true, question: sanitized });
});


// POST create question (Admin)
router.post('/', requireAdmin, (req, res) => {
  const { game, round, question, type, options, correct_answer, time_limit, base_points, image_url } = req.body;
  if (!game || !round || !question || !type || !correct_answer) {
    return res.status(400).json({ success: false, message: 'Game, round, question, type, and correct answer are required' });
  }

  const id = `q-${game[0]}-${round}-${Date.now()}`;
  const optionsJson = JSON.stringify(options || []);

  db.prepare(`
    INSERT INTO questions (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    game,
    Number(round),
    question.trim(),
    type,
    optionsJson,
    correct_answer.trim(),
    Number(time_limit) || 30,
    Number(base_points) || 10,
    image_url || '',
    new Date().toISOString()
  );

  return res.status(201).json({ success: true, message: 'Question created successfully', id });
});

// PUT update question (Admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { game, round, question, type, options, correct_answer, time_limit, base_points, image_url } = req.body;
  const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  const optionsJson = options !== undefined ? JSON.stringify(options) : undefined;

  db.prepare(`
    UPDATE questions SET
      game = coalesce(?, game),
      round = coalesce(?, round),
      question = coalesce(?, question),
      type = coalesce(?, type),
      options_json = coalesce(?, options_json),
      correct_answer = coalesce(?, correct_answer),
      time_limit = coalesce(?, time_limit),
      base_points = coalesce(?, base_points),
      image_url = coalesce(?, image_url)
    WHERE id = ?
  `).run(
    game ?? null,
    round !== undefined ? Number(round) : null,
    question ?? null,
    type ?? null,
    optionsJson ?? null,
    correct_answer ?? null,
    time_limit !== undefined ? Number(time_limit) : null,
    base_points !== undefined ? Number(base_points) : null,
    image_url ?? null,
    req.params.id
  );

  return res.json({ success: true, message: 'Question updated successfully' });
});

// DELETE question (Admin - Soft Delete)
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE questions SET is_deleted = 1, deleted_at = ? WHERE id = ?').run(now, req.params.id);
  syncToMySQL('UPDATE questions SET is_deleted = 1, deleted_at = ? WHERE id = ?', [now, req.params.id]);
  return res.json({ success: true, message: 'Question soft-deleted successfully' });
});

// Duplicate Question (Admin)
router.post('/:id/duplicate', requireAdmin, (req, res) => {
  const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!q) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  const newId = `q-${q.game[0]}-${q.round}-${Date.now()}`;
  db.prepare(`
    INSERT INTO questions (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    q.game,
    q.round,
    `${q.question} (Copy)`,
    q.type,
    q.options_json,
    q.correct_answer,
    q.time_limit,
    q.base_points,
    q.image_url,
    new Date().toISOString()
  );

  return res.status(201).json({ success: true, message: 'Question duplicated successfully', id: newId });
});

export default router;
