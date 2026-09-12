import express from 'express';
import db, { updateRanks } from '../db.js';
import { requireAdmin } from '../auth.js';
import { broadcastScoreboard } from '../socketHandler.js';

const router = express.Router();

// GET all teams (Public / Admin)
router.get('/', (req, res) => {
  const { game, status, registration_status, search } = req.query;
  let sql = 'SELECT * FROM teams WHERE 1=1';
  const params = [];

  if (game && game !== 'all') {
    sql += ' AND game = ?';
    params.push(game);
  }
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (registration_status && registration_status !== 'all') {
    sql += ' AND registration_status = ?';
    params.push(registration_status);
  }
  if (search) {
    sql += ' AND (team_name LIKE ? OR captain LIKE ? OR member1 LIKE ? OR member2 LIKE ? OR member3 LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  sql += ' ORDER BY score DESC, rank ASC, created_at DESC';

  const teams = db.prepare(sql).all(...params);
  return res.json({ success: true, count: teams.length, teams });
});

// GET single team profile with answers & breakdown
router.get('/:id', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const answers = db.prepare(`
    SELECT a.*, q.question, q.type as question_type, q.round as question_round
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE a.team_id = ?
    ORDER BY a.created_at ASC
  `).all(req.params.id);

  // Calculate breakdown per round
  const roundBreakdown = { 1: 0, 2: 0, 3: 0 };
  answers.forEach((ans) => {
    if (roundBreakdown[ans.round] !== undefined) {
      roundBreakdown[ans.round] += ans.total_points;
    }
  });

  return res.json({
    success: true,
    team: {
      ...team,
      roundScores: roundBreakdown,
      answers
    }
  });
});

// POST create team (Admin or Registration)
router.post('/', (req, res) => {
  const { team_name, game, captain, member1, member2, member3, contact } = req.body;
  if (!team_name || !game || !captain || !member1 || !member2 || !member3 || !contact) {
    return res.status(400).json({ success: false, message: 'All fields (Team Name, Game, Captain, 3 Members, Contact) are required' });
  }

  const existing = db.prepare('SELECT id FROM teams WHERE lower(team_name) = lower(?)').get(team_name.trim());
  if (existing) {
    return res.status(400).json({ success: false, message: `Team name "${team_name}" already exists!` });
  }

  const id = `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const regStatus = req.body.registration_status || 'VERIFIED';

  db.prepare(`
    INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, registration_status, score, rank, status, is_seed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 999, 'REGISTERED', 0, ?)
  `).run(id, team_name.trim(), game, captain.trim(), member1.trim(), member2.trim(), member3.trim(), contact.trim(), regStatus, new Date().toISOString());

  updateRanks(game);
  broadcastScoreboard();

  return res.status(201).json({ success: true, message: 'Team created successfully', id });
});

// PUT update team (Admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { team_name, game, captain, member1, member2, member3, contact, registration_status, status, score } = req.body;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  db.prepare(`
    UPDATE teams SET
      team_name = coalesce(?, team_name),
      game = coalesce(?, game),
      captain = coalesce(?, captain),
      member1 = coalesce(?, member1),
      member2 = coalesce(?, member2),
      member3 = coalesce(?, member3),
      contact = coalesce(?, contact),
      registration_status = coalesce(?, registration_status),
      status = coalesce(?, status),
      score = coalesce(?, score)
    WHERE id = ?
  `).run(team_name, game, captain, member1, member2, member3, contact, registration_status, status, score, req.params.id);

  updateRanks(team.game);
  if (game && game !== team.game) {
    updateRanks(game);
  }
  broadcastScoreboard();

  return res.json({ success: true, message: 'Team updated successfully' });
});

// DELETE team (Admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  db.prepare('DELETE FROM answers WHERE team_id = ?').run(req.params.id);
  db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);

  updateRanks(team.game);
  broadcastScoreboard();

  return res.json({ success: true, message: 'Team deleted successfully' });
});

// Clear Seed/Demo Teams (Admin)
router.delete('/seed/clear', requireAdmin, (req, res) => {
  const seedTeams = db.prepare('SELECT id, game FROM teams WHERE is_seed = 1').all();
  seedTeams.forEach(t => {
    db.prepare('DELETE FROM answers WHERE team_id = ?').run(t.id);
  });
  db.prepare('DELETE FROM teams WHERE is_seed = 1').run();
  updateRanks('brain');
  updateRanks('pictionary');
  broadcastScoreboard();
  return res.json({ success: true, message: `Cleared ${seedTeams.length} demo seed teams` });
});

// Bulk Import from CSV / JSON (Admin)
router.post('/import', requireAdmin, (req, res) => {
  const { teams } = req.body;
  if (!Array.isArray(teams) || teams.length === 0) {
    return res.status(400).json({ success: false, message: 'Valid array of teams required' });
  }

  let importedCount = 0;
  const duplicates = [];
  const errors = [];

  const insertStmt = db.prepare(`
    INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, registration_status, score, rank, status, is_seed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 999, 'REGISTERED', 0, ?)
  `);

  teams.forEach((item, index) => {
    const name = item.team_name || item['Team Name'] || item.teamName;
    const gameRaw = (item.game || item['Game'] || item.gameName || 'brain').toLowerCase();
    const game = gameRaw.includes('pic') ? 'pictionary' : 'brain';
    const m1 = item.member1 || item['Member 1'] || item.member_1 || '';
    const m2 = item.member2 || item['Member 2'] || item.member_2 || '';
    const m3 = item.member3 || item['Member 3'] || item.member_3 || '';
    const captain = item.captain || item['Captain'] || m1;
    const contact = item.contact || item['Contact'] || item['Phone'] || 'N/A';

    if (!name || !m1) {
      errors.push(`Row ${index + 1}: Missing team name or member`);
      return;
    }

    const exists = db.prepare('SELECT id FROM teams WHERE lower(team_name) = lower(?)').get(name.trim());
    if (exists) {
      duplicates.push(name);
      return;
    }

    const id = `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    insertStmt.run(id, name.trim(), game, captain.trim(), m1.trim(), m2.trim() || 'Member 2', m3.trim() || 'Member 3', contact.trim(), 'VERIFIED', new Date().toISOString());
    importedCount++;
  });

  updateRanks('brain');
  updateRanks('pictionary');
  broadcastScoreboard();

  return res.json({
    success: true,
    message: `Successfully imported ${importedCount} teams`,
    importedCount,
    duplicates,
    errors
  });
});

// Google Forms Webhook with API Key authentication
router.post('/webhook', (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey || req.body?.apiKey;
  const configuredKey = process.env.GOOGLE_FORM_API_KEY || 'engineers_day_google_form_key_2026';

  if (!apiKey || apiKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing Google Forms API Key. Provide x-api-key header or apiKey query parameter.'
    });
  }

  const body = req.body || {};

  // Case-insensitive flexible key lookup
  const findVal = (keywords) => {
    for (const key of Object.keys(body)) {
      const lowerKey = key.toLowerCase();
      for (const kw of keywords) {
        if (lowerKey.includes(kw.toLowerCase())) {
          return body[key];
        }
      }
    }
    return '';
  };

  const teamName = body.team_name || findVal(['team name', 'team_name', 'squad name', 'team']);
  const gameRaw = body.game || findVal(['game', 'competition', 'event']) || 'brain';
  const game = String(gameRaw).toLowerCase().includes('pic') ? 'pictionary' : 'brain';
  const captain = body.captain || findVal(['captain', 'leader', 'head']) || findVal(['member 1', 'member1']) || 'Captain';
  const member1 = body.member1 || findVal(['member 1', 'member1', 'captain']) || captain;
  const member2 = body.member2 || findVal(['member 2', 'member2']) || 'Member 2';
  const member3 = body.member3 || findVal(['member 3', 'member3']) || 'Member 3';
  const contact = body.contact || findVal(['contact', 'phone', 'mobile', 'whatsapp']) || 'N/A';

  if (!teamName || !String(teamName).trim()) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: Team Name. Received fields: ' + Object.keys(body).join(', ')
    });
  }

  const cleanName = String(teamName).trim();
  const existing = db.prepare('SELECT id FROM teams WHERE lower(team_name) = lower(?)').get(cleanName);
  if (existing) {
    return res.status(200).json({
      success: true,
      message: `Team "${cleanName}" is already registered!`,
      id: existing.id
    });
  }

  const id = `team-gf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, registration_status, score, rank, status, is_seed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', 0, 999, 'REGISTERED', 0, ?)
  `).run(
    id,
    cleanName,
    game,
    String(captain).trim(),
    String(member1).trim(),
    String(member2).trim(),
    String(member3).trim(),
    String(contact).trim(),
    new Date().toISOString()
  );

  updateRanks(game);
  broadcastScoreboard();

  return res.status(201).json({
    success: true,
    message: `Team "${cleanName}" registered successfully via Google Forms Webhook!`,
    team: { id, team_name: cleanName, game, captain, contact }
  });
});

export default router;
