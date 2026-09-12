import express from 'express';
import db from '../db.js';
import { requireAdmin } from '../auth.js';

const router = express.Router();

// GET all public & admin settings
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM event_settings').all();
  const eventSettings = {};
  rows.forEach(r => {
    eventSettings[r.key] = r.value;
  });

  const scoringRows = db.prepare('SELECT * FROM scoring_settings').all();
  const scoringSettings = {};
  scoringRows.forEach(s => {
    scoringSettings[s.game] = s;
  });

  return res.json({
    success: true,
    eventSettings,
    scoringSettings
  });
});

// UPDATE Event Settings (Admin)
router.put('/event', requireAdmin, (req, res) => {
  const settings = req.body; // { eventName, googleFormUrl, eventStatus, ... }
  const upsert = db.prepare(`
    INSERT INTO event_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  Object.entries(settings).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      upsert.run(key, String(val));
    }
  });

  return res.json({ success: true, message: 'Event settings updated successfully' });
});

// GET scoring settings
router.get('/scoring', (req, res) => {
  const scoring = db.prepare('SELECT * FROM scoring_settings').all();
  return res.json({ success: true, scoring });
});

// UPDATE Scoring Settings for a game (Admin)
router.put('/scoring/:game', requireAdmin, (req, res) => {
  const { game } = req.params;
  const {
    base_points,
    timer_duration,
    negative_points,
    tier_0_5,
    tier_6_10,
    tier_11_15,
    tier_16_20,
    tier_21_25,
    tier_26_30,
    tie_breaker
  } = req.body;

  const existing = db.prepare('SELECT game FROM scoring_settings WHERE game = ?').get(game);
  if (!existing) {
    return res.status(404).json({ success: false, message: `Scoring settings for game "${game}" not found` });
  }

  db.prepare(`
    UPDATE scoring_settings SET
      base_points = coalesce(?, base_points),
      timer_duration = coalesce(?, timer_duration),
      negative_points = coalesce(?, negative_points),
      tier_0_5 = coalesce(?, tier_0_5),
      tier_6_10 = coalesce(?, tier_6_10),
      tier_11_15 = coalesce(?, tier_11_15),
      tier_16_20 = coalesce(?, tier_16_20),
      tier_21_25 = coalesce(?, tier_21_25),
      tier_26_30 = coalesce(?, tier_26_30),
      tie_breaker = coalesce(?, tie_breaker)
    WHERE game = ?
  `).run(
    base_points,
    timer_duration,
    negative_points,
    tier_0_5,
    tier_6_10,
    tier_11_15,
    tier_16_20,
    tier_21_25,
    tier_26_30,
    tie_breaker,
    game
  );

  return res.json({ success: true, message: `Scoring criteria for ${game} updated successfully` });
});

export default router;
