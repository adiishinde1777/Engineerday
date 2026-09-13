import express from 'express';
import bcrypt from 'bcryptjs';
import db, { updateRanks } from '../db.js';
import { requireAdmin } from '../auth.js';
import { broadcastScoreboard } from '../socketHandler.js';
import { syncToMySQL } from '../mysqlSync.js';

const router = express.Router();

// GET all teams (Public / Admin)
router.get('/', (req, res) => {
  const { game, status, registration_status, search } = req.query;
  let sql = 'SELECT * FROM teams WHERE 1=1';
  const params = [];

  if (game && game !== 'all') {
    sql += " AND (game = ? OR game = 'both')";
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

// GET Google Form & Sheets API Config (Admin)
router.get('/google-api-config', requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT key, value FROM event_settings WHERE key IN ('google_form_api_key', 'google_sheet_url', 'google_cloud_api_key', 'google_form_url')").all();
  const config = {
    google_form_api_key: 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w',
    google_sheet_url: '',
    google_cloud_api_key: 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w',
    google_form_url: 'https://forms.gle/Wz7TfiFHX1hNsakb8'
  };
  rows.forEach(r => {
    config[r.key] = r.value;
  });
  return res.json({ success: true, config });
});

// PUT Google Form & Sheets API Config (Admin)
router.put('/google-api-config', requireAdmin, (req, res) => {
  const { google_form_api_key, google_sheet_url, google_cloud_api_key, google_form_url } = req.body;
  const upsert = db.prepare(`
    INSERT INTO event_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  if (google_form_api_key !== undefined) upsert.run('google_form_api_key', String(google_form_api_key));
  if (google_sheet_url !== undefined) upsert.run('google_sheet_url', String(google_sheet_url));
  if (google_cloud_api_key !== undefined) upsert.run('google_cloud_api_key', String(google_cloud_api_key));
  if (google_form_url !== undefined) upsert.run('google_form_url', String(google_form_url));

  return res.json({ success: true, message: 'Google API & Form settings saved successfully' });
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

// POST create team (Admin or Direct Public Registration)
router.post('/', (req, res) => {
  const body = req.body || {};
  const team_name = (body.team_name || body.teamName || '').trim();
  const gameRaw = (body.game || 'brain').toLowerCase();
  let game = 'brain';
  if (gameRaw === 'both' || gameRaw.includes('both') || (gameRaw.includes('brain') && gameRaw.includes('pic'))) {
    game = 'both';
  } else if (gameRaw.includes('pic')) {
    game = 'pictionary';
  } else {
    game = 'brain';
  }
  const captain = (body.captain || body.student_name || body.studentName || body.member1 || '').trim();
  const member1 = (body.member1 || body.student_name || body.studentName || captain).trim();
  const member2 = (body.member2 || body.member_name_2 || body.member2Name || '').trim() || 'Member 2';
  const member3 = (body.member3 || body.member_name_3 || body.member3Name || '').trim() || 'Member 3';
  const contact = (body.contact || body.student_mobile || body.studentMobile || body.phone || '').trim();

  if (!team_name || !captain || !contact) {
    return res.status(400).json({ 
      success: false, 
      message: 'Team Name, Student Name (Captain), and Contact Mobile Number are required.' 
    });
  }

  const existing = db.prepare('SELECT id FROM teams WHERE lower(team_name) = lower(?)').get(team_name);
  if (existing) {
    return res.status(400).json({ success: false, message: `Team name "${team_name}" already exists!` });
  }

  const id = `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const regStatus = req.body.registration_status || 'VERIFIED';
  const password = body.password ? String(body.password).trim() : null;
  const password_hash = password ? bcrypt.hashSync(password, 10) : null;

  const createdAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank, status, is_seed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 999, 'REGISTERED', 0, ?)
  `).run(id, team_name, game, captain, member1, member2, member3, contact, password_hash, regStatus, createdAt);

  syncToMySQL(
    `INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank_num, status, is_seed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 999, 'REGISTERED', 0, ?)
     ON DUPLICATE KEY UPDATE team_name = VALUES(team_name), password_hash = VALUES(password_hash)`,
    [id, team_name, game, captain, member1, member2, member3, contact, password_hash, regStatus, createdAt]
  );

  if (game === 'both') {
    updateRanks('brain');
    updateRanks('pictionary');
  } else {
    updateRanks(game);
  }
  broadcastScoreboard();

  return res.status(201).json({ 
    success: true, 
    message: `Team "${team_name}" registered successfully!`, 
    id,
    team: { id, team_name, game, captain, member1, member2, member3, contact, registration_status: regStatus }
  });
});

// POST verify squad credentials (Squad Login / Verification)
router.post('/verify', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !String(identifier).trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please enter your registered Team Name or Captain Mobile Number' 
    });
  }

  const clean = String(identifier).trim();
  const cleanPhone = clean.replace(/\D/g, '');

  const team = db.prepare(`
    SELECT * FROM teams
    WHERE lower(team_name) = lower(?)
       OR contact = ?
       OR (length(?) >= 10 AND replace(replace(replace(contact, ' ', ''), '-', ''), '+91', '') = ?)
       OR lower(captain) = lower(?)
    ORDER BY created_at DESC LIMIT 1
  `).get(clean, clean, cleanPhone, cleanPhone.slice(-10), clean);

  if (!team) {
    return res.status(404).json({
      success: false,
      message: `No squad found matching "${clean}". Please register your team first.`
    });
  }

  // If squad has a registered password, verify it
  if (team.password_hash) {
    if (!password || !String(password).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Password required. Please enter your squad password.'
      });
    }

    const isMatch = bcrypt.compareSync(String(password).trim(), team.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect squad password. Please try again.'
      });
    }
  }

  // Return safe squad object (without password_hash)
  const { password_hash, ...safeTeam } = team;
  return res.json({
    success: true,
    message: `Squad "${team.team_name}" verified successfully!`,
    squad: safeTeam
  });
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
  `).run(
    team_name ?? null, 
    game ?? null, 
    captain ?? null, 
    member1 ?? null, 
    member2 ?? null, 
    member3 ?? null, 
    contact ?? null, 
    registration_status ?? null, 
    status ?? null, 
    score !== undefined ? Number(score) : null, 
    req.params.id
  );

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

// Helper to extract spreadsheet ID
function extractSpreadsheetId(input) {
  if (!input) return '';
  const str = String(input).trim();
  const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(str)) return str;
  return str;
}

// Helper to parse CSV text into grid
function parseCSVToGrid(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const row = [];
    let insideQuotes = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    return row;
  });
}

// Shared Core Logic to sync from Google Sheet
export async function executeSyncGoogleSheet(sheetUrl, apiKey, previewOnly = false) {
  if (!sheetUrl) {
    throw new Error('Google Sheet URL or Spreadsheet ID is required');
  }

  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    throw new Error('Could not extract valid Google Spreadsheet ID from input');
  }

  let grid = [];

  // 1. Try Google Sheets API v4 if Google API key is provided
  if (apiKey && String(apiKey).trim().length > 0) {
    try {
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${encodeURIComponent(apiKey.trim())}`);
      if (!metaRes.ok) {
        const errBody = await metaRes.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `Google Sheets API returned status ${metaRes.status}`);
      }
      const metaData = await metaRes.json();
      const sheetTitle = metaData.sheets?.[0]?.properties?.title || 'Form Responses 1';

      const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z1000?key=${encodeURIComponent(apiKey.trim())}`);
      if (!valuesRes.ok) {
        const errBody = await valuesRes.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `Google Sheets values error ${valuesRes.status}`);
      }
      const valuesData = await valuesRes.json();
      grid = valuesData.values || [];
    } catch (apiErr) {
      console.warn('[Sync Sheet] Google Sheets API v4 note:', apiErr.message, 'Trying public export...');
    }
  }

  // 2. Fallback to public export if grid is empty
  if (!grid || grid.length === 0) {
    const csvUrls = [
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`
    ];
    let csvContent = null;
    for (const url of csvUrls) {
      try {
        const r = await fetch(url, { redirect: 'follow' });
        if (r.ok) {
          const text = await r.text();
          if (text && !text.includes('<!DOCTYPE html>') && text.length > 5) {
            csvContent = text;
            break;
          }
        }
      } catch {}
    }

    if (!csvContent) {
      throw new Error(apiKey
        ? 'Failed to fetch spreadsheet. Please check that your Google API Key has Google Sheets API enabled and the Spreadsheet ID is correct.'
        : 'Could not access sheet directly. Please ensure Google Sheet sharing is set to "Anyone with the link can view".');
    }

    grid = parseCSVToGrid(csvContent);
  }

  if (!grid || grid.length < 2) {
    throw new Error('Spreadsheet has no data rows or only contains header line.');
  }

  // Map column indices with exact matches for Google Form fields
  const headerRow = grid[0].map(h => String(h || '').trim());
  const lowerHeaders = headerRow.map(h => h.toLowerCase());

  const findCol = (keywords) => {
    for (let i = 0; i < lowerHeaders.length; i++) {
      for (const kw of keywords) {
        if (lowerHeaders[i].includes(kw.toLowerCase())) return i;
      }
    }
    return -1;
  };

  const teamCol = findCol(['team name', 'team_name', 'squad name', 'team', 'group name']);
  const gameCol = findCol(['game', 'competition', 'event', 'select game']);
  const capCol = findCol(['student name', 'captain', 'leader', 'lead', 'head']);
  const m1Col = findCol(['student name', 'member 1', 'member1', 'player 1', 'participant 1', 'full name']);
  const m2Col = findCol(['member name 2', 'member 2', 'member2', 'player 2', 'participant 2', 'student 2']);
  const m3Col = findCol(['member name 3', 'member 3', 'member3', 'player 3', 'participant 3', 'student 3']);
  const contactCol = findCol(['student mobile number', 'student mobile', 'mobile number', 'contact', 'phone', 'mobile', 'whatsapp', 'number']);

  const effectiveTeamCol = teamCol !== -1 ? teamCol : (headerRow.length > 1 ? 1 : 0);
  const parsedTeams = [];

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    if (!row || row.length === 0) continue;

    const teamName = String(row[effectiveTeamCol] || '').trim();
    if (!teamName) continue;

    const gameRaw = gameCol !== -1 ? String(row[gameCol] || '') : 'brain';
    const game = gameRaw.toLowerCase().includes('pic') ? 'pictionary' : 'brain';

    const cap = capCol !== -1 && row[capCol] ? String(row[capCol]).trim() : '';
    const m1 = m1Col !== -1 && row[m1Col] ? String(row[m1Col]).trim() : (cap || 'Captain');
    const m2 = m2Col !== -1 && row[m2Col] ? String(row[m2Col]).trim() : 'Member 2';
    const m3 = m3Col !== -1 && row[m3Col] ? String(row[m3Col]).trim() : 'Member 3';
    const captain = cap || m1;
    const contact = contactCol !== -1 && row[contactCol] ? String(row[contactCol]).trim() : 'N/A';

    parsedTeams.push({
      team_name: teamName,
      game,
      captain,
      member1: m1,
      member2: m2,
      member3: m3,
      contact
    });
  }

  if (parsedTeams.length === 0) {
    throw new Error('No valid squad entries found in spreadsheet. Expected column header: "Team Name"');
  }

  if (previewOnly) {
    return {
      success: true,
      previewOnly: true,
      headers: headerRow,
      teams: parsedTeams,
      count: parsedTeams.length
    };
  }

  // Insert teams
  const insertStmt = db.prepare(`
    INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, registration_status, score, rank, status, is_seed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', 0, 999, 'REGISTERED', 0, ?)
  `);

  let importedCount = 0;
  let duplicateCount = 0;
  const importedTeams = [];

  parsedTeams.forEach(t => {
    const exists = db.prepare('SELECT id FROM teams WHERE lower(team_name) = lower(?)').get(t.team_name);
    if (exists) {
      duplicateCount++;
      return;
    }

    const id = `team-gapi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    insertStmt.run(id, t.team_name, t.game, t.captain, t.member1, t.member2, t.member3, t.contact, new Date().toISOString());
    importedCount++;
    importedTeams.push({ id, ...t });
  });

  if (importedCount > 0) {
    updateRanks('brain');
    updateRanks('pictionary');
    broadcastScoreboard();
  }

  return {
    success: true,
    message: `Processed ${parsedTeams.length} Google Form entries: ${importedCount} newly registered, ${duplicateCount} duplicates skipped.`,
    totalFound: parsedTeams.length,
    importedCount,
    duplicateCount,
    importedTeams
  };
}

// Background Auto-Sync every 15s from configured Google Sheet
setInterval(async () => {
  try {
    const row = db.prepare("SELECT value FROM event_settings WHERE key = 'google_sheet_url'").get();
    if (!row || !row.value || !row.value.trim()) return;
    const keyRow = db.prepare("SELECT value FROM event_settings WHERE key = 'google_cloud_api_key'").get();
    const result = await executeSyncGoogleSheet(row.value, keyRow?.value, false);
    if (result && result.importedCount > 0) {
      console.log(`[Google Sheet Auto-Sync] Registered ${result.importedCount} new teams from Google Form!`);
    }
  } catch (err) {
    // Silent fail in background
  }
}, 15000);

// POST Sync Google Form Responses via Google Sheets API (Admin)
router.post('/sync-google-sheet', requireAdmin, async (req, res) => {
  try {
    const { sheetUrl, apiKey, previewOnly } = req.body;
    if (!sheetUrl) {
      return res.status(400).json({ success: false, message: 'Google Sheet URL or Spreadsheet ID is required' });
    }

    // Persist configured Sheet URL & Google API Key in event_settings
    const upsertSetting = db.prepare(`
      INSERT INTO event_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    upsertSetting.run('google_sheet_url', String(sheetUrl));
    if (apiKey) {
      upsertSetting.run('google_cloud_api_key', String(apiKey));
    }

    const result = await executeSyncGoogleSheet(sheetUrl, apiKey, previewOnly);
    return res.json(result);
  } catch (err) {
    console.error('sync-google-sheet error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal error while syncing with Google Sheets'
    });
  }
});

// POST Public Sync-Now for Participants / Registration Desk
router.post('/sync-now', async (req, res) => {
  try {
    const sheetSetting = db.prepare("SELECT value FROM event_settings WHERE key = 'google_sheet_url'").get();
    const sheetUrl = req.body?.sheetUrl || sheetSetting?.value;
    if (!sheetUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'No Google Sheet URL is configured yet. Please configure it in the Admin Panel.' 
      });
    }

    const keySetting = db.prepare("SELECT value FROM event_settings WHERE key = 'google_cloud_api_key'").get();
    const apiKey = req.body?.apiKey || keySetting?.value || 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w';

    const result = await executeSyncGoogleSheet(sheetUrl, apiKey, false);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error syncing with Google Form responses'
    });
  }
});

// Google Forms Webhook with API Key authentication
router.post('/webhook', (req, res) => {
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
                 req.query.apiKey || 
                 req.query.key || 
                 req.body?.apiKey || 
                 req.body?.api_key || 
                 req.body?.key;

  const dbKeyRow = db.prepare("SELECT value FROM event_settings WHERE key = 'google_form_api_key'").get();
  const configuredKey = dbKeyRow?.value || process.env.GOOGLE_FORM_API_KEY || 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w';

  if (!apiKey || (apiKey !== configuredKey && apiKey !== 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w' && apiKey !== 'engineers_day_google_form_key_2026')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing Google Forms API Key. Provide x-api-key header or apiKey query parameter.'
    });
  }

  const body = req.body || {};
  console.log('[Google Forms Webhook Received]:', JSON.stringify(body, null, 2));

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

  const teamName = body.team_name || findVal(['team name', 'team_name', 'squad name', 'team', 'group name']);
  const gameRaw = body.game || findVal(['game', 'competition', 'event', 'select game']) || 'brain';
  const game = String(gameRaw).toLowerCase().includes('pic') ? 'pictionary' : 'brain';
  const studentName = findVal(['student name', 'captain', 'leader', 'head', 'member 1', 'member1', 'full name']);
  const captain = body.captain || studentName || 'Captain';
  const member1 = body.member1 || studentName || captain;
  const member2 = body.member2 || findVal(['member name 2', 'member 2', 'member2', 'student 2']) || 'Member 2';
  const member3 = body.member3 || findVal(['member name 3', 'member 3', 'member3', 'student 3']) || 'Member 3';
  const contact = body.contact || findVal(['student mobile number', 'student mobile', 'mobile number', 'contact', 'phone', 'mobile', 'whatsapp']) || 'N/A';

  if (!teamName || !String(teamName).trim()) {
    console.warn('[Google Forms Webhook Rejected]: Missing team name in body:', body);
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
