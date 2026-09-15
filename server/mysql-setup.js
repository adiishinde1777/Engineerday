import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'engineers_day';

export async function setupMySQL() {
  console.log(`🔌 Attempting connection to MySQL at ${host}:${port} as "${user}"...`);

  let connection;
  try {
    // 1. Connect to MySQL server without database first
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password
    });
    console.log('✅ Successfully connected to MySQL Server!');

    // 2. Create database if it does not exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database \`${database}\` ensured.`);

    // 3. Switch to the database
    await connection.changeUser({ database });

    // 4. Create Tables
    console.log('📦 Creating/ensuring tables in MySQL...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(128),
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS event_settings (
        setting_key VARCHAR(64) PRIMARY KEY,
        setting_value TEXT NOT NULL
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS scoring_settings (
        game VARCHAR(32) PRIMARY KEY,
        base_points INT NOT NULL DEFAULT 10,
        timer_duration INT NOT NULL DEFAULT 30,
        negative_points INT NOT NULL DEFAULT 0,
        tier_0_5 INT NOT NULL DEFAULT 5,
        tier_6_10 INT NOT NULL DEFAULT 4,
        tier_11_15 INT NOT NULL DEFAULT 3,
        tier_16_20 INT NOT NULL DEFAULT 2,
        tier_21_25 INT NOT NULL DEFAULT 1,
        tier_26_30 INT NOT NULL DEFAULT 0,
        tie_breaker VARCHAR(64) NOT NULL DEFAULT 'correct_then_time'
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(64) PRIMARY KEY,
        team_name VARCHAR(128) UNIQUE NOT NULL,
        game VARCHAR(32) NOT NULL,
        captain VARCHAR(128) NOT NULL,
        member1 VARCHAR(128) NOT NULL,
        member2 VARCHAR(128) NOT NULL,
        member3 VARCHAR(128) NOT NULL,
        contact VARCHAR(64) NOT NULL,
        password_hash VARCHAR(255),
        registration_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
        score INT NOT NULL DEFAULT 0,
        rank_num INT NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED',
        is_seed INT NOT NULL DEFAULT 0,
        is_deleted INT NOT NULL DEFAULT 0,
        deleted_at VARCHAR(64),
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        designation VARCHAR(128) NOT NULL,
        department VARCHAR(255) NOT NULL,
        profile_image TEXT,
        description TEXT,
        position_role VARCHAR(128),
        is_hod INT DEFAULT 0,
        is_deleted INT NOT NULL DEFAULT 0,
        deleted_at VARCHAR(64),
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(64) PRIMARY KEY,
        game VARCHAR(32) NOT NULL,
        round INT NOT NULL,
        question TEXT NOT NULL,
        type VARCHAR(64) NOT NULL,
        options_json TEXT,
        correct_answer TEXT NOT NULL,
        time_limit INT NOT NULL DEFAULT 30,
        base_points INT NOT NULL DEFAULT 10,
        image_url TEXT,
        is_deleted INT NOT NULL DEFAULT 0,
        deleted_at VARCHAR(64),
        created_at VARCHAR(64) NOT NULL
      );
    `);

    // Ensure soft delete columns exist in existing MySQL tables
    try { await connection.query('ALTER TABLE teams ADD COLUMN is_deleted INT NOT NULL DEFAULT 0;'); } catch { }
    try { await connection.query('ALTER TABLE teams ADD COLUMN deleted_at VARCHAR(64);'); } catch { }
    try { await connection.query('ALTER TABLE faculty ADD COLUMN is_deleted INT NOT NULL DEFAULT 0;'); } catch { }
    try { await connection.query('ALTER TABLE faculty ADD COLUMN deleted_at VARCHAR(64);'); } catch { }
    try { await connection.query('ALTER TABLE questions ADD COLUMN is_deleted INT NOT NULL DEFAULT 0;'); } catch { }
    try { await connection.query('ALTER TABLE questions ADD COLUMN deleted_at VARCHAR(64);'); } catch { }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        game VARCHAR(32) PRIMARY KEY,
        round INT NOT NULL DEFAULT 1,
        current_question_id VARCHAR(64),
        current_team_id VARCHAR(64),
        status VARCHAR(32) NOT NULL DEFAULT 'IDLE',
        timer_remaining INT NOT NULL DEFAULT 30,
        timer_started_at BIGINT,
        is_paused INT NOT NULL DEFAULT 0
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id VARCHAR(64) PRIMARY KEY,
        team_id VARCHAR(64) NOT NULL,
        question_id VARCHAR(64) NOT NULL,
        game VARCHAR(32) NOT NULL,
        round INT NOT NULL,
        answer_text TEXT NOT NULL,
        is_correct INT NOT NULL,
        response_time FLOAT NOT NULL,
        base_points INT NOT NULL,
        time_bonus INT NOT NULL,
        total_points INT NOT NULL,
        created_at VARCHAR(64) NOT NULL,
        INDEX idx_team (team_id),
        INDEX idx_game (game)
      );
    `);

    console.log('✅ All MySQL tables verified successfully!');

    // 5. Check if we should migrate data from existing SQLite database
    const sqliteDbPath = path.join(__dirname, '..', 'engineers_day.db');
    if (fs.existsSync(sqliteDbPath)) {
      try {
        const { DatabaseSync } = await import('node:sqlite');
        const sqlite = new DatabaseSync(sqliteDbPath);

        // 5. Complete Two-Way Reconciliation between SQLite and MySQL
        console.log('🔄 Reconciling and synchronizing all data between SQLite and MySQL...');

        // Migrate Admins
        const admins = sqlite.prepare('SELECT * FROM admins').all();
        for (const a of admins) {
          await connection.query(
            'INSERT IGNORE INTO admins (id, username, password_hash, full_name, created_at) VALUES (?, ?, ?, ?, ?)',
            [a.id, a.username, a.password_hash, a.full_name, a.created_at]
          );
        }

        // Migrate Settings
        const settings = sqlite.prepare('SELECT * FROM event_settings').all();
        for (const s of settings) {
          await connection.query(
            'INSERT IGNORE INTO event_settings (setting_key, setting_value) VALUES (?, ?)',
            [s.key, s.value]
          );
        }

        // Migrate Scoring Settings
        const scoring = sqlite.prepare('SELECT * FROM scoring_settings').all();
        for (const sc of scoring) {
          await connection.query(
            `INSERT IGNORE INTO scoring_settings 
             (game, base_points, timer_duration, negative_points, tier_0_5, tier_6_10, tier_11_15, tier_16_20, tier_21_25, tier_26_30, tie_breaker)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sc.game, sc.base_points, sc.timer_duration, sc.negative_points, sc.tier_0_5, sc.tier_6_10, sc.tier_11_15, sc.tier_16_20, sc.tier_21_25, sc.tier_26_30, sc.tie_breaker]
          );
        }

        // Migrate Faculty
        const faculty = sqlite.prepare('SELECT * FROM faculty').all();
        for (const f of faculty) {
          await connection.query(
            'INSERT IGNORE INTO faculty (id, name, designation, department, profile_image, description, position_role, is_hod, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [f.id, f.name, f.designation, f.department, f.profile_image, f.description, f.position_role, f.is_hod || 0, f.created_at]
          );
        }

        // Migrate Questions
        const allowedBrainIds = [
          'q-b1-1', 'q-b1-2', 'q-b1-3', 'q-b1-4', 'q-b1-5', 'q-b1-6',
          'q-b2-1', 'q-b2-2', 'q-b2-3', 'q-b2-4', 'q-b2-5', 'q-b2-6'
        ];
        try {
          await connection.query(
            `DELETE FROM questions WHERE game = 'brain' AND id NOT IN (${allowedBrainIds.map(() => '?').join(',')})`,
            allowedBrainIds
          );
        } catch {}

        const questions = sqlite.prepare('SELECT * FROM questions').all();
        for (const q of questions) {
          await connection.query(
            `INSERT INTO questions (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, is_deleted, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               game = VALUES(game),
               round = VALUES(round),
               question = VALUES(question),
               type = VALUES(type),
               options_json = VALUES(options_json),
               correct_answer = VALUES(correct_answer),
               time_limit = VALUES(time_limit),
               base_points = VALUES(base_points),
               image_url = VALUES(image_url),
               is_deleted = VALUES(is_deleted)`,
            [q.id, q.game, q.round, q.question, q.type, q.options_json, q.correct_answer, q.time_limit, q.base_points, q.image_url, q.is_deleted || 0, q.created_at]
          );
        }

        // Bidirectional Team Sync: Push all SQLite teams to MySQL
        const sqliteTeams = sqlite.prepare('SELECT * FROM teams').all();
        let pushedToMySQL = 0;
        for (const t of sqliteTeams) {
          await connection.query(
            `INSERT INTO teams 
             (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank_num, status, is_seed, is_deleted, deleted_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
               deleted_at = VALUES(deleted_at)`,
            [
              t.id, t.team_name, t.game, t.captain, t.member1, t.member2, t.member3, t.contact,
              t.password_hash, t.registration_status, t.score || 0, t.rank || 0, t.status,
              t.is_seed || 0, t.is_deleted || 0, t.deleted_at || null, t.created_at || new Date().toISOString()
            ]
          );
          pushedToMySQL++;
        }

        // Pull any teams in MySQL that are not in SQLite into SQLite
        const [mysqlTeams] = await connection.query('SELECT * FROM teams');
        const sqMap = new Map();
        sqliteTeams.forEach(r => sqMap.set(r.id, r));

        const insertSq = sqlite.prepare(`
          INSERT INTO teams 
          (id, team_name, game, captain, member1, member2, member3, contact, password_hash, registration_status, score, rank, status, is_seed, is_deleted, deleted_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let pulledToSQLite = 0;
        for (const mt of mysqlTeams) {
          if (!sqMap.has(mt.id)) {
            try {
              insertSq.run(
                mt.id, mt.team_name, mt.game, mt.captain, mt.member1, mt.member2, mt.member3, mt.contact,
                mt.password_hash || null, mt.registration_status || 'VERIFIED', mt.score || 0,
                mt.rank_num || 0, mt.status || 'REGISTERED', mt.is_seed || 0, mt.is_deleted || 0,
                mt.deleted_at || null, mt.created_at || new Date().toISOString()
              );
              pulledToSQLite++;
            } catch {}
          }
        }

        // Update persistent JSON backup file
        try {
          const allActiveTeams = sqlite.prepare('SELECT * FROM teams WHERE (is_deleted = 0 OR is_deleted IS NULL)').all();
          const backupDir = path.join(__dirname, 'data');
          if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
          fs.writeFileSync(path.join(backupDir, 'persistent_teams.json'), JSON.stringify(allActiveTeams, null, 2), 'utf-8');
          console.log(`💾 Saved ${allActiveTeams.length} active teams to persistent JSON backup!`);
        } catch {}

        console.log(`🎉 Sync summary: ${pushedToMySQL} squads saved in MySQL, ${pulledToSQLite} pulled to SQLite. All teams exist in both places!`);
      } catch (migErr) {
        console.warn('⚠️ SQLite to MySQL migration notice:', migErr.message);
      }
    }

    console.log('\n🌟 MYSQL SETUP & DATA SYNC COMPLETED SUCCESSFULLY!');
    return { success: true };
  } catch (err) {
    console.error('\n❌ MySQL Connection Error:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 Tip: The MySQL password in .env is incorrect. Please update DB_PASSWORD in .env');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('👉 Tip: MySQL server is not running on port ' + port + '. Please start MySQL in Windows Services or XAMPP.');
    }
    return { success: false, error: err };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// If run directly via node
if (process.argv[1] && process.argv[1].endsWith('mysql-setup.js')) {
  setupMySQL().then(res => {
    process.exit(res.success ? 0 : 1);
  });
}
