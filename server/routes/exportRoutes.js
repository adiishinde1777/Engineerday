import express from 'express';
import db from '../db.js';
import { requireAdmin } from '../auth.js';

const router = express.Router();

function toCSV(headers, rows) {
  const headerLine = headers.map(h => `"${h.label}"`).join(',');
  const rowLines = rows.map(r => {
    return headers.map(h => {
      const val = r[h.key] !== undefined && r[h.key] !== null ? String(r[h.key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });
  return [headerLine, ...rowLines].join('\r\n');
}

// Export Registrations CSV
router.get('/registrations', requireAdmin, (req, res) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY game ASC, created_at DESC').all();
  const headers = [
    { label: 'Team Name', key: 'team_name' },
    { label: 'Game', key: 'game' },
    { label: 'Captain', key: 'captain' },
    { label: 'Member 1', key: 'member1' },
    { label: 'Member 2', key: 'member2' },
    { label: 'Member 3', key: 'member3' },
    { label: 'Contact', key: 'contact' },
    { label: 'Registration Status', key: 'registration_status' },
    { label: 'Registered At', key: 'created_at' }
  ];

  const csv = toCSV(headers, teams);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Engineers_Day_2026_Registrations.csv"');
  return res.send(csv);
});

// Export Game Scores CSV
router.get('/scores', requireAdmin, (req, res) => {
  const answers = db.prepare(`
    SELECT a.*, t.team_name, q.question
    FROM answers a
    JOIN teams t ON a.team_id = t.id
    JOIN questions q ON a.question_id = q.id
    ORDER BY a.game ASC, a.round ASC, a.created_at ASC
  `).all();

  const headers = [
    { label: 'Game', key: 'game' },
    { label: 'Round', key: 'round' },
    { label: 'Team Name', key: 'team_name' },
    { label: 'Question', key: 'question' },
    { label: 'Submitted Answer', key: 'answer_text' },
    { label: 'Is Correct', key: 'is_correct' },
    { label: 'Response Time (s)', key: 'response_time' },
    { label: 'Base Points', key: 'base_points' },
    { label: 'Time Bonus', key: 'time_bonus' },
    { label: 'Total Points', key: 'total_points' },
    { label: 'Timestamp', key: 'created_at' }
  ];

  const csv = toCSV(headers, answers);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Engineers_Day_2026_Game_Scores.csv"');
  return res.send(csv);
});

// Export Final Results CSV
router.get('/results', requireAdmin, (req, res) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY game ASC, rank ASC, score DESC').all();
  const headers = [
    { label: 'Rank', key: 'rank' },
    { label: 'Team Name', key: 'team_name' },
    { label: 'Game', key: 'game' },
    { label: 'Total Score', key: 'score' },
    { label: 'Status', key: 'status' },
    { label: 'Captain', key: 'captain' },
    { label: 'Contact', key: 'contact' }
  ];

  const csv = toCSV(headers, teams);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Engineers_Day_2026_Final_Results.csv"');
  return res.send(csv);
});

// Export Faculty CSV
router.get('/faculty', requireAdmin, (req, res) => {
  const faculty = db.prepare('SELECT * FROM faculty ORDER BY created_at ASC').all();
  const headers = [
    { label: 'Name', key: 'name' },
    { label: 'Designation', key: 'designation' },
    { label: 'Department', key: 'department' },
    { label: 'Description', key: 'description' }
  ];

  const csv = toCSV(headers, faculty);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Engineers_Day_2026_Faculty.csv"');
  return res.send(csv);
});

export default router;
