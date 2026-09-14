import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RENDER_API_URL = process.env.RENDER_API_URL || 'https://engineerday.onrender.com';

export async function syncFromRender() {
  console.log(`🌐 Fetching latest live data from Render: ${RENDER_API_URL}...`);

  let liveTeams = [];
  try {
    const res = await fetch(`${RENDER_API_URL}/api/teams`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.teams)) {
      throw new Error(data.message || 'Invalid response format from Render');
    }
    liveTeams = data.teams;
    console.log(`✅ Retrieved ${liveTeams.length} teams from Render!`);
  } catch (err) {
    console.error('❌ Failed to fetch from Render:', err.message);
    return;
  }

  // 1. Sync to local SQLite
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const sqliteDbPath = path.join(__dirname, '..', 'engineers_day.db');
    const db = new DatabaseSync(sqliteDbPath);

    const insertSQLite = db.prepare(`
      INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank, status, is_seed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        team_name = excluded.team_name,
        game = excluded.game,
        captain = excluded.captain,
        member1 = excluded.member1,
        member2 = excluded.member2,
        member3 = excluded.member3,
        contact = excluded.contact,
        password_hash = COALESCE(excluded.password_hash, teams.password_hash),
        registration_status = excluded.registration_status,
        score = excluded.score,
        rank = excluded.rank,
        status = excluded.status
    `);

    for (const t of liveTeams) {
      insertSQLite.run(
        t.id,
        t.team_name,
        t.game,
        t.captain,
        t.member1,
        t.member2,
        t.member3,
        t.contact,
        t.password_hash || null,
        t.registration_status || 'VERIFIED',
        t.score || 0,
        t.rank || 0,
        t.status || 'REGISTERED',
        t.is_seed || 0,
        t.created_at || new Date().toISOString()
      );
    }
    console.log('✅ Synced to local SQLite (engineers_day.db)!');
  } catch (sqlErr) {
    console.warn('⚠️ SQLite sync note:', sqlErr.message);
  }

  // 2. Sync to local MySQL
  try {
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'engineers_day';

    const conn = await mysql.createConnection({ host, port, user, password, database });

    for (const t of liveTeams) {
      await conn.query(`
        INSERT INTO teams 
        (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank_num, status, is_seed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          team_name = VALUES(team_name),
          game = VALUES(game),
          captain = VALUES(captain),
          member1 = VALUES(member1),
          member2 = VALUES(member2),
          member3 = VALUES(member3),
          contact = VALUES(contact),
          password_hash = COALESCE(VALUES(password_hash), password_hash),
          registration_status = VALUES(registration_status),
          score = VALUES(score),
          rank_num = VALUES(rank_num),
          status = VALUES(status)
      `, [
        t.id,
        t.team_name,
        t.game,
        t.captain,
        t.member1,
        t.member2,
        t.member3,
        t.contact,
        t.password_hash || null,
        t.registration_status || 'VERIFIED',
        t.score || 0,
        t.rank || 0,
        t.status || 'REGISTERED',
        t.is_seed || 0,
        t.created_at || new Date().toISOString()
      ]);
    }
    await conn.end();
    console.log('✅ Synced to local MySQL (database: engineers_day)!');
  } catch (myErr) {
    console.warn('⚠️ MySQL sync note:', myErr.message);
  }

  console.log('\n🎉 ALL LIVE RENDER TEAMS SUCCESSFULLY SYNCED TO LOCAL DATABASES!');
}

if (process.argv[1] && process.argv[1].endsWith('sync-from-render.js')) {
  syncFromRender();
}
