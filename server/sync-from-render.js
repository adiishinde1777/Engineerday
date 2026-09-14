import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RENDER_API_URL = process.env.RENDER_API_URL || 'https://engineerday.onrender.com';

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'engineers_day';

export async function syncRenderAndLocal() {
  console.log(`\n======================================================`);
  console.log(`🔄 TWO-WAY SYNC: LOCAL DATABASE <=> LIVE RENDER WEBSITE`);
  console.log(`======================================================`);
  console.log(`🌐 Connecting to Render: ${RENDER_API_URL}...`);

  // 1. Fetch live teams from Render
  let liveTeams = [];
  try {
    const res = await fetch(`${RENDER_API_URL}/api/teams`);
    const data = await res.json();
    if (data.success && Array.isArray(data.teams)) {
      liveTeams = data.teams;
      console.log(`✅ Retrieved ${liveTeams.length} active teams from Render website.`);
    } else {
      console.warn(`⚠️ Could not parse Render teams:`, data);
    }
  } catch (err) {
    console.error(`❌ Could not connect to Render website:`, err.message);
  }

  // 2. Read local SQLite teams
  const sqliteDbPath = path.join(__dirname, '..', 'engineers_day.db');
  const db = new DatabaseSync(sqliteDbPath);
  let localSqliteTeams = db.prepare('SELECT * FROM teams WHERE (is_deleted = 0 OR is_deleted IS NULL)').all();
  console.log(`💻 Found ${localSqliteTeams.length} active teams in local SQLite.`);

  // 3. Read local MySQL teams
  let localMySqlTeams = [];
  let mysqlConn = null;
  try {
    mysqlConn = await mysql.createConnection({ host, port, user, password, database });
    const [rows] = await mysqlConn.query('SELECT * FROM teams WHERE (is_deleted = 0 OR is_deleted IS NULL)');
    localMySqlTeams = rows;
    console.log(`🐬 Found ${localMySqlTeams.length} active teams in local MySQL.`);
  } catch (err) {
    console.warn(`⚠️ Local MySQL connection note:`, err.message);
  }

  // Combine local teams (union by ID or lowercased name)
  const allLocalMap = new Map();
  for (const t of localSqliteTeams) {
    allLocalMap.set(t.id, t);
    allLocalMap.set(`name:${t.team_name.toLowerCase()}`, t);
  }
  for (const t of localMySqlTeams) {
    if (!allLocalMap.has(t.id) && !allLocalMap.has(`name:${t.team_name.toLowerCase()}`)) {
      allLocalMap.set(t.id, t);
      allLocalMap.set(`name:${t.team_name.toLowerCase()}`, t);
      // Add to SQLite as well
      try {
        db.prepare(`
          INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank, status, is_seed, is_deleted, deleted_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          t.id, t.team_name, t.game, t.captain, t.member1, t.member2, t.member3, t.contact,
          t.password_hash || null, t.registration_status || 'VERIFIED', t.score || 0,
          t.rank_num || 0, t.status || 'REGISTERED', t.is_seed || 0, t.is_deleted || 0,
          t.deleted_at || null, t.created_at || new Date().toISOString()
        );
      } catch {}
    }
  }

  // Get distinct local list
  const distinctLocalTeams = Array.from(new Set(Array.from(allLocalMap.values())));

  // 4. Sync Render -> Local (pull any teams created on Render down to local SQLite & MySQL)
  const localIdSet = new Set(distinctLocalTeams.map(t => t.id));
  const localNameSet = new Set(distinctLocalTeams.map(t => t.team_name.toLowerCase()));
  let pulledCount = 0;

  for (const rt of liveTeams) {
    if (!localIdSet.has(rt.id) && !localNameSet.has(rt.team_name.toLowerCase())) {
      // Pull to SQLite
      try {
        db.prepare(`
          INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank, status, is_seed, is_deleted, deleted_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          rt.id, rt.team_name, rt.game, rt.captain, rt.member1, rt.member2, rt.member3, rt.contact,
          rt.password_hash || null, rt.registration_status || 'VERIFIED', rt.score || 0,
          rt.rank || 0, rt.status || 'REGISTERED', rt.is_seed || 0, rt.is_deleted || 0,
          rt.deleted_at || null, rt.created_at || new Date().toISOString()
        );
      } catch (err) {
        console.warn('SQLite insert note:', err.message);
      }

      // Pull to MySQL
      if (mysqlConn) {
        try {
          await mysqlConn.query(`
            INSERT INTO teams (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank_num, status, is_seed, is_deleted, deleted_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE team_name = VALUES(team_name)
          `, [
            rt.id, rt.team_name, rt.game, rt.captain, rt.member1, rt.member2, rt.member3, rt.contact,
            rt.password_hash || null, rt.registration_status || 'VERIFIED', rt.score || 0,
            rt.rank || 0, rt.status || 'REGISTERED', rt.is_seed || 0, rt.is_deleted || 0,
            rt.deleted_at || null, rt.created_at || new Date().toISOString()
          ]);
        } catch (err) {
          console.warn('MySQL insert note:', err.message);
        }
      }
      pulledCount++;
      distinctLocalTeams.push(rt);
    }
  }

  if (pulledCount > 0) {
    console.log(`⬇️ Pulled ${pulledCount} new squads from Render into your local database!`);
  }

  // 5. Sync Local -> Render (push all distinct local teams up to Render)
  let pushedCount = 0;
  if (distinctLocalTeams.length > 0) {
    try {
      const pushRes = await fetch(`${RENDER_API_URL}/api/teams/sync-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: distinctLocalTeams })
      });
      const pushData = await pushRes.json();
      if (pushData.success) {
        pushedCount = pushData.count || distinctLocalTeams.length;
        console.log(`⬆️ Pushed ${pushedCount} squads from your local database up to Render live website!`);
      } else {
        console.warn(`⚠️ Render push response:`, pushData.message || pushData);
      }
    } catch (err) {
      console.error(`❌ Push to Render failed:`, err.message);
    }
  }

  if (mysqlConn) {
    await mysqlConn.end();
  }

  console.log(`======================================================`);
  console.log(`🎉 SYNC COMPLETE!`);
  console.log(`   - Local SQLite: ${distinctLocalTeams.length} teams`);
  console.log(`   - Local MySQL:  ${distinctLocalTeams.length} teams`);
  console.log(`   - Live Render:  ${distinctLocalTeams.length} teams`);
  console.log(`======================================================\n`);
}

if (process.argv[1] && process.argv[1].endsWith('sync-from-render.js')) {
  syncRenderAndLocal()
    .catch(err => console.error('Sync error:', err))
    .finally(() => process.exit(0));
}
