import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { savePersistentTeamsBackup } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

let pool = null;
let isConnected = false;

// Create connection pool
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'engineers_day',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // Verify connection
  pool.query('SELECT 1')
    .then(() => {
      isConnected = true;
      console.log('✅ [MySQL Sync] Connected to MySQL database:', process.env.DB_NAME || 'engineers_day');
    })
    .catch((err) => {
      isConnected = false;
      console.warn('⚠️ [MySQL Sync] Initial connection note:', err.message);
    });
} catch (err) {
  console.warn('[MySQL Sync] Pool initialization error:', err.message);
}

export function isMySQLAvailable() {
  return Boolean(pool && isConnected);
}

/**
 * Execute arbitrary query on MySQL (safe and non-blocking)
 */
export async function syncToMySQL(query, params = []) {
  if (!pool || !query || typeof query !== 'string') return;
  try {
    await pool.query(query, params);
  } catch (err) {
    console.warn('[MySQL Query Note]:', err.message);
  }
}

/**
 * Upsert a single team into MySQL
 */
export async function upsertTeamToMySQL(team) {
  if (!pool || !team) return;
  try {
    const rankNum = team.rank !== undefined ? Number(team.rank) : (team.rank_num !== undefined ? Number(team.rank_num) : 0);
    const isDel = team.is_deleted ? 1 : 0;
    const sql = `
      INSERT INTO teams (
        id, team_name, game, captain, member1, member2, member3, contact,
        password_hash, registration_status, score, rank_num, status, is_seed, is_deleted, deleted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        status = VALUES(status),
        is_seed = VALUES(is_seed),
        is_deleted = VALUES(is_deleted),
        deleted_at = VALUES(deleted_at)
    `;

    await pool.query(sql, [
      team.id,
      team.team_name,
      team.game || 'brain',
      team.captain || 'Captain',
      team.member1 || team.captain || 'Member 1',
      team.member2 || 'Member 2',
      team.member3 || 'Member 3',
      team.contact || 'N/A',
      team.password_hash || null,
      team.registration_status || 'VERIFIED',
      team.score || 0,
      rankNum,
      team.status || 'REGISTERED',
      team.is_seed ? 1 : 0,
      isDel,
      team.deleted_at || null,
      team.created_at || new Date().toISOString()
    ]);
  } catch (err) {
    console.warn('[MySQL Upsert Note]:', err.message);
  }
}

let isSyncInProgress = false;

/**
 * Bidirectional Synchronizer:
 * 1. Reads all active teams from MySQL and syncs any new/updated teams into SQLite.
 * 2. Checks if SQLite has any teams not yet in MySQL, and writes them into MySQL.
 * 3. Never deletes or marks active registrations as deleted.
 * 4. Backs up all teams to server/data/persistent_teams.json.
 */
export async function syncMySQLToSQLite(db, broadcastCallback = null, updateRanksFunc = null) {
  if (!pool || isSyncInProgress) return;
  isSyncInProgress = true;

  try {
    // 1. Fetch all teams from MySQL
    const [myRows] = await pool.query(`
      SELECT 
        id, team_name, game, captain, member1, member2, member3, contact,
        password_hash, registration_status, score, rank_num, status, is_seed,
        is_deleted, deleted_at, created_at
      FROM teams
    `);

    isConnected = true;

    // 2. Fetch all teams currently in SQLite
    const sqRows = db.prepare('SELECT * FROM teams').all();
    const sqMap = new Map();
    sqRows.forEach(r => {
      sqMap.set(r.id, r);
      if (r.team_name) {
        sqMap.set(`name:${r.team_name.toLowerCase()}`, r);
      }
    });

    let hasChanges = false;

    // Prepare SQLite statements
    const insertSQLite = db.prepare(`
      INSERT INTO teams (
        id, team_name, game, captain, member1, member2, member3, contact,
        password_hash, registration_status, score, rank, status, is_seed, is_deleted, deleted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateSQLite = db.prepare(`
      UPDATE teams SET
        team_name = ?,
        game = ?,
        captain = ?,
        member1 = ?,
        member2 = ?,
        member3 = ?,
        contact = ?,
        password_hash = COALESCE(?, password_hash),
        registration_status = ?,
        score = ?,
        rank = ?,
        status = ?,
        is_seed = ?,
        is_deleted = ?,
        deleted_at = ?
      WHERE id = ?
    `);

    // Sync from MySQL -> SQLite
    for (const m of myRows) {
      const existing = sqMap.get(m.id) || (m.team_name ? sqMap.get(`name:${m.team_name.toLowerCase()}`) : null);

      if (!existing) {
        // If MySQL has a team not in SQLite, insert it
        insertSQLite.run(
          m.id,
          m.team_name,
          m.game || 'brain',
          m.captain || 'Captain',
          m.member1 || m.captain || 'Member 1',
          m.member2 || 'Member 2',
          m.member3 || 'Member 3',
          m.contact || 'N/A',
          m.password_hash || null,
          m.registration_status || 'VERIFIED',
          m.score || 0,
          m.rank_num || 0,
          m.status || 'REGISTERED',
          m.is_seed ? 1 : 0,
          m.is_deleted ? 1 : 0,
          m.deleted_at || null,
          m.created_at || new Date().toISOString()
        );
        hasChanges = true;
      } else {
        // Team exists in both.
        // CRITICAL PROTECTION: An active team in SQLite (is_deleted = 0) must NEVER be auto-deleted by background sync
        const targetDeleted = (existing.is_deleted === 0 || !existing.is_deleted) && m.is_deleted === 1
          ? 0 // Protect active SQLite team from deletion!
          : (m.is_deleted ? 1 : 0);

        const diff =
          existing.team_name !== m.team_name ||
          existing.game !== m.game ||
          existing.captain !== m.captain ||
          existing.member1 !== m.member1 ||
          existing.member2 !== m.member2 ||
          existing.member3 !== m.member3 ||
          existing.contact !== m.contact ||
          existing.registration_status !== m.registration_status ||
          existing.score !== m.score ||
          existing.status !== m.status ||
          (existing.is_deleted ? 1 : 0) !== targetDeleted;

        if (diff) {
          updateSQLite.run(
            m.team_name,
            m.game,
            m.captain,
            m.member1,
            m.member2,
            m.member3,
            m.contact,
            m.password_hash || null,
            m.registration_status,
            m.score,
            existing.rank || m.rank_num || 0,
            m.status,
            m.is_seed ? 1 : 0,
            targetDeleted,
            targetDeleted ? m.deleted_at : null,
            existing.id
          );
          hasChanges = true;
        }

        // Keep MySQL rank_num in sync with SQLite rank without triggering diff loops
        if (existing.rank !== undefined && m.rank_num !== existing.rank) {
          await pool.query('UPDATE teams SET rank_num = ? WHERE id = ?', [existing.rank || 0, existing.id]);
        }

        // If SQLite has an active team but MySQL had is_deleted=1, also restore it in MySQL
        if ((existing.is_deleted === 0 || !existing.is_deleted) && m.is_deleted === 1) {
          await upsertTeamToMySQL(existing);
        }
      }
    }

    // Also check if any team in SQLite is missing from MySQL -> push to MySQL
    const myIdSet = new Set(myRows.map(r => r.id));
    for (const sq of sqRows) {
      if (!myIdSet.has(sq.id)) {
        await upsertTeamToMySQL(sq);
      }
    }

    // Two-way Questions sync
    try {
      const [myQuestions] = await pool.query('SELECT * FROM questions');
      const sqQuestions = db.prepare('SELECT * FROM questions').all();
      const sqQMap = new Map();
      sqQuestions.forEach(q => sqQMap.set(q.id, q));
      const myQSet = new Set(myQuestions.map(q => q.id));

      const insertQSqlite = db.prepare(`
        INSERT INTO questions (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, is_deleted, deleted_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const mq of myQuestions) {
        if (!sqQMap.has(mq.id)) {
          insertQSqlite.run(
            mq.id,
            mq.game,
            mq.round,
            mq.question,
            mq.type,
            typeof mq.options_json === 'string' ? mq.options_json : JSON.stringify(mq.options_json || []),
            mq.correct_answer,
            mq.time_limit || 30,
            mq.base_points || 10,
            mq.image_url || '',
            mq.is_deleted ? 1 : 0,
            mq.deleted_at || null,
            mq.created_at ? String(mq.created_at) : new Date().toISOString()
          );
          hasChanges = true;
        }
      }

      for (const sqQ of sqQuestions) {
        if (!myQSet.has(sqQ.id)) {
          await pool.query(`
            INSERT INTO questions (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, is_deleted, deleted_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE question = VALUES(question), correct_answer = VALUES(correct_answer), options_json = VALUES(options_json)
          `, [
            sqQ.id, sqQ.game, sqQ.round, sqQ.question, sqQ.type, sqQ.options_json, sqQ.correct_answer,
            sqQ.time_limit || 30, sqQ.base_points || 10, sqQ.image_url || '', sqQ.is_deleted || 0,
            sqQ.deleted_at || null, sqQ.created_at || new Date().toISOString()
          ]);
        }
      }
    } catch {}

    // Two-way Faculty sync
    try {
      const [myFaculty] = await pool.query('SELECT * FROM faculty');
      const sqFaculty = db.prepare('SELECT * FROM faculty').all();
      const sqFMap = new Map();
      sqFaculty.forEach(f => sqFMap.set(f.id, f));
      const myFSet = new Set(myFaculty.map(f => f.id));

      const insertFSqlite = db.prepare(`
        INSERT INTO faculty (id, order_index, name, designation, department, profile_image, description, position_role, is_hod, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const mf of myFaculty) {
        if (!sqFMap.has(mf.id)) {
          insertFSqlite.run(
            mf.id,
            mf.order_index || 99,
            mf.name,
            mf.designation,
            mf.department || '',
            mf.profile_image || '',
            mf.description || '',
            mf.position_role || '',
            mf.is_hod ? 1 : 0,
            mf.created_at ? String(mf.created_at) : new Date().toISOString()
          );
          hasChanges = true;
        }
      }

      for (const sf of sqFaculty) {
        if (!myFSet.has(sf.id)) {
          await pool.query(`
            INSERT INTO faculty (id, name, designation, department, profile_image, description, position_role, is_hod, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name), designation = VALUES(designation)
          `, [
            sf.id, sf.name, sf.designation, sf.department || '', sf.profile_image || '',
            sf.description || '', sf.position_role || '', sf.is_hod ? 1 : 0, sf.created_at || new Date().toISOString()
          ]);
        }
      }
    } catch {}

    // Save active teams to persistent JSON backup file
    savePersistentTeamsBackup();

    // If changes were detected, update leaderboard ranks and broadcast live
    if (hasChanges) {
      if (typeof updateRanksFunc === 'function') {
        updateRanksFunc('brain');
        updateRanksFunc('pictionary');
      }
      if (typeof broadcastCallback === 'function') {
        broadcastCallback();
      }
      console.log('🔄 [MySQL Sync] Successfully synchronized database records between MySQL and website SQLite!');
    }
  } catch (err) {
    if (isConnected) {
      console.warn('[MySQL Sync Run Note]:', err.message);
    }
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Start continuous background sync (every few seconds)
 */
export function startContinuousSync(db, broadcastCallback, updateRanksFunc, intervalMs = 3000) {
  // Initial sync immediately
  syncMySQLToSQLite(db, broadcastCallback, updateRanksFunc).catch(() => {});

  // Periodic interval
  const timer = setInterval(() => {
    syncMySQLToSQLite(db, broadcastCallback, updateRanksFunc).catch(() => {});
  }, intervalMs);

  return timer;
}

export default pool;
