import express from 'express';
import db from '../db.js';
import { requireAdmin } from '../auth.js';

const router = express.Router();

// GET questions
router.get('/', (req, res) => {
  const { game, round, type, search } = req.query;
  let sql = 'SELECT * FROM questions WHERE 1=1';
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
  const questions = db.prepare(sql).all(...params);

  // Parse options_json
  const formatted = questions.map((q) => {
    let opts = [];
    try {
      opts = JSON.parse(q.options_json || '[]');
    } catch {
      opts = [];
    }
    return { ...q, options: opts };
  });

  return res.json({ success: true, count: formatted.length, questions: formatted });
});

// GET single question
router.get('/:id', (req, res) => {
  const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!q) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }
  let opts = [];
  try {
    opts = JSON.parse(q.options_json || '[]');
  } catch {
    opts = [];
  }
  return res.json({ success: true, question: { ...q, options: opts } });
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
    game,
    round !== undefined ? Number(round) : null,
    question,
    type,
    optionsJson,
    correct_answer,
    time_limit !== undefined ? Number(time_limit) : null,
    base_points !== undefined ? Number(base_points) : null,
    image_url,
    req.params.id
  );

  return res.json({ success: true, message: 'Question updated successfully' });
});

// DELETE question (Admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Question deleted successfully' });
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
