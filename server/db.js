import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'engineers_day.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');

// Initialize Tables
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scoring_settings (
      game TEXT PRIMARY KEY,
      base_points INTEGER NOT NULL DEFAULT 10,
      timer_duration INTEGER NOT NULL DEFAULT 30,
      negative_points INTEGER NOT NULL DEFAULT 0,
      tier_0_5 INTEGER NOT NULL DEFAULT 5,
      tier_6_10 INTEGER NOT NULL DEFAULT 4,
      tier_11_15 INTEGER NOT NULL DEFAULT 3,
      tier_16_20 INTEGER NOT NULL DEFAULT 2,
      tier_21_25 INTEGER NOT NULL DEFAULT 1,
      tier_26_30 INTEGER NOT NULL DEFAULT 0,
      tie_breaker TEXT NOT NULL DEFAULT 'correct_then_time'
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      team_name TEXT UNIQUE NOT NULL,
      game TEXT NOT NULL,
      captain TEXT NOT NULL,
      member1 TEXT NOT NULL,
      member2 TEXT NOT NULL,
      member3 TEXT NOT NULL,
      contact TEXT NOT NULL,
      password_hash TEXT,
      registration_status TEXT NOT NULL DEFAULT 'VERIFIED',
      score INTEGER NOT NULL DEFAULT 0,
      rank INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'REGISTERED',
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faculty (
      id TEXT PRIMARY KEY,
      order_index INTEGER DEFAULT 99,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      profile_image TEXT,
      description TEXT,
      position_role TEXT,
      is_hod INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  try {
    db.exec('ALTER TABLE faculty ADD COLUMN order_index INTEGER DEFAULT 99;');
  } catch {}

  try {
    db.exec('ALTER TABLE faculty ADD COLUMN position_role TEXT;');
  } catch {}

  try {
    db.exec('ALTER TABLE faculty ADD COLUMN is_hod INTEGER DEFAULT 0;');
  } catch {}

  try {
    db.exec('ALTER TABLE teams ADD COLUMN password_hash TEXT;');
  } catch {}

  // Soft delete columns
  try {
    db.exec('ALTER TABLE teams ADD COLUMN is_deleted INTEGER DEFAULT 0;');
  } catch {}
  try {
    db.exec('ALTER TABLE teams ADD COLUMN deleted_at TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE faculty ADD COLUMN is_deleted INTEGER DEFAULT 0;');
  } catch {}
  try {
    db.exec('ALTER TABLE faculty ADD COLUMN deleted_at TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE questions ADD COLUMN is_deleted INTEGER DEFAULT 0;');
  } catch {}
  try {
    db.exec('ALTER TABLE questions ADD COLUMN deleted_at TEXT;');
  } catch {}


  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      game TEXT NOT NULL,
      round INTEGER NOT NULL,
      question TEXT NOT NULL,
      type TEXT NOT NULL,
      options_json TEXT,
      correct_answer TEXT NOT NULL,
      time_limit INTEGER NOT NULL DEFAULT 30,
      base_points INTEGER NOT NULL DEFAULT 10,
      image_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      game TEXT PRIMARY KEY,
      round INTEGER NOT NULL DEFAULT 1,
      current_question_id TEXT,
      current_team_id TEXT,
      status TEXT NOT NULL DEFAULT 'IDLE',
      timer_remaining INTEGER NOT NULL DEFAULT 30,
      timer_started_at INTEGER,
      is_paused INTEGER NOT NULL DEFAULT 0,
      started_at TEXT
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      game TEXT NOT NULL,
      round INTEGER NOT NULL,
      answer_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      response_time REAL NOT NULL,
      base_points INTEGER NOT NULL,
      time_bonus INTEGER NOT NULL,
      total_points INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  try {
    db.exec('ALTER TABLE game_sessions ADD COLUMN started_at TEXT;');
  } catch {}

  seedDefaultData();
}

function seedDefaultData() {
  // Check admin
  const adminCheck = db.prepare('SELECT count(*) as count FROM admins').get();
  if (!adminCheck || adminCheck.count === 0) {
    const defaultPasswordHash = bcrypt.hashSync('admin@engineer2026', 10);
    const insertAdmin = db.prepare(`
      INSERT INTO admins (id, username, password_hash, full_name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertAdmin.run(
      'admin-root-01',
      'admin',
      defaultPasswordHash,
      'Aditya Shinde (Lead Administrator)',
      new Date().toISOString()
    );
    console.log('[DB] Default admin created: admin / admin@engineer2026');
  }

  // Event Settings default
  const defaultSettings = [
    { key: 'eventName', value: "Engineers' Day Celebration 2026" },
    { key: 'eventDate', value: '2026-09-15T10:00:00' },
    { key: 'eventSubtitle', value: 'Think. Create. Solve. Engineer the Future.' },
    { key: 'departmentName', value: 'Department of Electronics Engineering (VLSI Design and Technology)' },
    { key: 'eventDescription', value: 'Organized by the Department of Electronics Engineering (VLSI Design and Technology) in honor of Dr. Shrikant Honade. Join the premier departmental showdown: Engineer’s Brain and Engineering Pictionary.' },
    { key: 'googleFormUrl', value: 'https://forms.gle/Wz7TfiFHX1hNsakb8' },
    { key: 'google_form_api_key', value: 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w' },
    { key: 'google_cloud_api_key', value: 'AIzaSyCaD14Bcn-MCGkdCUDWnfWzddq8GGUZ5_w' },
    { key: 'eventStatus', value: 'AUTO' }, // AUTO, UPCOMING, LIVE, COMPLETED
    { key: 'footerText', value: "Engineer's Day 2026 | Designed & Developed by Aditya Shinde" },
    { key: 'developerName', value: 'Aditya Shinde' },
    { key: 'winnersFinalized', value: 'false' },
    { key: 'reportingInstructions', value: 'All team members must report at the Technical Hub 30 minutes prior to round 1 with valid college ID cards.' },
    { key: 'google_sheet_url', value: 'https://docs.google.com/spreadsheets/d/1-aZXcwZR93NNCeK6OD4OgZhdAh3gfukRbwN_mBGTLbE/edit?resourcekey=&gid=1718195895#gid=1718195895' },
    { key: 'registrations_locked', value: 'false' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO event_settings (key, value) VALUES (?, ?)
  `);
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }

  // Scoring settings defaults
  const insertScoring = db.prepare(`
    INSERT OR IGNORE INTO scoring_settings 
    (game, base_points, timer_duration, negative_points, tier_0_5, tier_6_10, tier_11_15, tier_16_20, tier_21_25, tier_26_30, tie_breaker)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertScoring.run('brain', 10, 180, 0, 5, 4, 3, 2, 1, 0, 'correct_then_time');
  insertScoring.run('pictionary', 10, 30, 0, 5, 4, 3, 2, 1, 0, 'correct_then_time');

  // Game sessions initialize
  const insertSession = db.prepare(`
    INSERT OR IGNORE INTO game_sessions (game, round, status, timer_remaining, is_paused)
    VALUES (?, 1, 'IDLE', 180, 0)
  `);
  insertSession.run('brain');
  insertSession.run('pictionary');

  // Reset & Seed Department Faculty: Electronics Engineering (VLSI Design and Technology)
  const seedFaculty = [
    {
      id: 'fac-1',
      order_index: 1,
      name: 'Dr. Shrikant Honade',
      designation: 'Head of Department & Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Head of Department (HoD)',
      is_hod: 1,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-2',
      order_index: 2,
      name: 'Mr. Tushar Mohije',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-3',
      order_index: 3,
      name: 'Mr. Ganesh Patil',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-4',
      order_index: 4,
      name: 'Mrs. Komal Dandge',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-5',
      order_index: 5,
      name: 'Mr. Gaurav Bhalekar',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-6',
      order_index: 6,
      name: 'Mr. Pandurang Kathar',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-7',
      order_index: 7,
      name: 'Mr. Rohit Chudiwal',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-8',
      order_index: 8,
      name: 'Mr. Hemant Ambhore',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-9',
      order_index: 9,
      name: 'Mrs. Aditi Mante',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-10',
      order_index: 10,
      name: 'Mrs. Samruddhi Chillure',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-11',
      order_index: 11,
      name: 'Mrs. Vidya Deshmukh',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-12',
      order_index: 12,
      name: 'Dr. Sohel Rana',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    },
    {
      id: 'fac-13',
      order_index: 13,
      name: 'Ms. Anjali Ghorpade',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design and Technology)',
      position_role: 'Faculty Coordinator',
      is_hod: 0,
      profile_image: '',
      description: ''
    }
  ];

  // Refresh faculty or ensure HOD designation is assigned
  const checkFaculty = db.prepare("SELECT count(*) as count FROM faculty").get();
  if (!checkFaculty || checkFaculty.count === 0) {
    const insertFaculty = db.prepare(`
      INSERT INTO faculty (id, order_index, name, designation, department, profile_image, description, position_role, is_hod, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const f of seedFaculty) {
      insertFaculty.run(f.id, f.order_index, f.name, f.designation, f.department, f.profile_image, f.description, f.position_role, f.is_hod || 0, new Date().toISOString());
    }
  } else {
    // Ensure at least one member is marked as HOD
    const checkHODMarked = db.prepare("SELECT count(*) as count FROM faculty WHERE is_hod = 1").get();
    if (!checkHODMarked || checkHODMarked.count === 0) {
      db.prepare(`
        UPDATE faculty SET is_hod = 1
        WHERE id = (
          SELECT id FROM faculty 
          WHERE position_role LIKE '%HOD%' OR designation LIKE '%Head%' OR name LIKE '%Honde%' OR name LIKE '%Honade%' 
          ORDER BY created_at ASC LIMIT 1
        )
      `).run();
    }
  }

  // Restore teams from persistent backup file so registrations are never lost across restarts/refreshes
  restoreTeamsFromBackup();

  // Seed Questions for Engineer's Brain & Engineering Pictionary
  const qCheck = db.prepare('SELECT count(*) as count FROM questions').get();
  if (!qCheck || qCheck.count === 0) {
    const insertQ = db.prepare(`
      INSERT INTO questions 
      (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedQuestions = [
      // BRAIN ROUND 1 (Official Tournament MCQs)
      {
        id: 'q-b1-1',
        game: 'brain',
        round: 1,
        question: 'Which component opposes the flow of electric current?',
        type: 'Multiple Choice',
        options: JSON.stringify(['Capacitor', 'Resistor', 'Inductor', 'Diode']),
        answer: 'Resistor',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b1-2',
        game: 'brain',
        round: 1,
        question: "A 4-bit binary number is 1011. What is its 2's complement?",
        type: 'Digital Logic',
        options: JSON.stringify(['0100', '0101', '1010', '0110']),
        answer: '0101',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b1-3',
        game: 'brain',
        round: 1,
        question: 'Which material is most widely used in semiconductor manufacturing?',
        type: 'Semiconductor',
        options: JSON.stringify(['Copper', 'Silicon', 'Aluminium', 'Silver']),
        answer: 'Silicon',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b1-4',
        game: 'brain',
        round: 1,
        question: "Engineers' Day in India is celebrated on the birth anniversary of which engineer?",
        type: 'Famous Engineer 🇮🇳',
        options: JSON.stringify(['Dr. A. P. J. Abdul Kalam', 'Sir M. Visvesvaraya', 'Homi J. Bhabha', 'Vikram Sarabhai']),
        answer: 'Sir M. Visvesvaraya',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b1-5',
        game: 'brain',
        round: 1,
        question: 'Pointing to a man, Rahul said: "He is the son of the only son of my grandfather." Who is the man to Rahul?',
        type: 'Family Relation',
        options: JSON.stringify(['Father', 'Brother', 'Uncle', 'Cousin']),
        answer: 'Brother',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b1-6',
        game: 'brain',
        round: 1,
        question: 'What is the valence electron count of silicon?',
        type: 'Basic Semiconductor Physics',
        options: JSON.stringify(['4', '8', '5', 'None of the above']),
        answer: '4',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },

      // PICTIONARY ROUND 1 (Tools & Core Concepts)
      {
        id: 'q-p1-1',
        game: 'pictionary',
        round: 1,
        question: 'Oscilloscope (Electronic Test Instrument)',
        type: 'Electronics',
        options: '[]',
        answer: 'Oscilloscope',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-p1-2',
        game: 'pictionary',
        round: 1,
        question: 'Wind Turbine & Renewable Generator',
        type: 'Mechanical / Electrical',
        options: '[]',
        answer: 'Wind Turbine',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-p1-3',
        game: 'pictionary',
        round: 1,
        question: 'Suspension Bridge (Cable Stayed)',
        type: 'Civil',
        options: '[]',
        answer: 'Suspension Bridge',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },

      // PICTIONARY ROUND 2 (Modern Tech & Hardware)
      {
        id: 'q-p2-1',
        game: 'pictionary',
        round: 2,
        question: 'Microchip / Silicon Wafer',
        type: 'VLSI / Semiconductor',
        options: '[]',
        answer: 'Microchip',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-p2-2',
        game: 'pictionary',
        round: 2,
        question: 'Robotic Arm / Industrial Manipulator',
        type: 'Robotics',
        options: '[]',
        answer: 'Robotic Arm',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-p2-3',
        game: 'pictionary',
        round: 2,
        question: 'Satellite Dish & Space Communication',
        type: 'Telecommunication',
        options: '[]',
        answer: 'Satellite Dish',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },

      // PICTIONARY ROUND 3 (Advanced Systems)
      {
        id: 'q-p3-1',
        game: 'pictionary',
        round: 3,
        question: 'Neural Network / Artificial Intelligence Brain',
        type: 'AI / Computer',
        options: '[]',
        answer: 'Neural Network',
        timeLimit: 30,
        basePoints: 15,
        imageUrl: ''
      },
      {
        id: 'q-p3-2',
        game: 'pictionary',
        round: 3,
        question: '3D Printer / Additive Manufacturing',
        type: 'Engineering Tools',
        options: '[]',
        answer: '3D Printer',
        timeLimit: 30,
        basePoints: 15,
        imageUrl: ''
      }
    ];

    for (const q of seedQuestions) {
      insertQ.run(
        q.id,
        q.game,
        q.round,
        q.question,
        q.type,
        q.options,
        q.answer,
        q.timeLimit,
        q.basePoints,
        q.imageUrl,
        new Date().toISOString()
      );
    }
  }

  // Ensure Brain Round 2 and Round 3 questions exist
  const brainR2Check = db.prepare("SELECT count(*) as count FROM questions WHERE game = 'brain' AND round = 2").get();
  if (!brainR2Check || brainR2Check.count === 0) {
    const insertQ = db.prepare(`
      INSERT INTO questions 
      (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const additionalBrainQuestions = [
      // BRAIN ROUND 2 (Official Tournament MCQs)
      {
        id: 'q-b2-1',
        game: 'brain',
        round: 2,
        question: 'Which hardware is especially designed for parallel AI calculations?',
        type: 'Multiple Choice',
        options: JSON.stringify(['GPU', 'Keyboard', 'Printer', 'Relay']),
        answer: 'GPU',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-2',
        game: 'brain',
        round: 2,
        question: 'A combinational circuit has no:',
        type: 'Multiple Choice',
        options: JSON.stringify(['Inputs', 'Outputs', 'Memory', 'Logic gates']),
        answer: 'Memory',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-3',
        game: 'brain',
        round: 2,
        question: 'if x + (1/x) = 3 ,  then find  [ x^2 + (1/x^2) ]',
        type: 'Multiple Choice',
        options: JSON.stringify(['5', '10', '7', '9']),
        answer: '7',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-4',
        game: 'brain',
        round: 2,
        question: 'A combinational circuit has 4 inputs and 2 outputs. Which device could perform this function?',
        type: 'Multiple Choice',
        options: JSON.stringify(['4-to-2 Decoder', '4-to-2 Encoder', '4-bit Counter', '2-bit Comparator']),
        answer: '4-to-2 Encoder',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-5',
        game: 'brain',
        round: 2,
        question: 'Which memory is volatile?',
        type: 'Multiple Choice',
        options: JSON.stringify(['ROM', 'Flash memory', 'RAM', 'EEPROM']),
        answer: 'RAM',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-6',
        game: 'brain',
        round: 2,
        question: 'Two Capacitor of 6 farad  each are connected in parallel. Their equivalent resistance is:',
        type: 'Multiple Choice',
        options: JSON.stringify(['12 farad', '6 farad', '3 farad', '1.5 farad']),
        answer: '12 farad',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },

      // BRAIN ROUND 3 (Mastermind VLSI & Hardware Architecture Finals)
      {
        id: 'q-b3-1',
        game: 'brain',
        round: 3,
        question: 'In VLSI physical layout, which Design Rule Check (DRC) prevents interconnect metal lines from short-circuiting?',
        type: 'VLSI Layout / DRC',
        options: JSON.stringify(['Minimum Spacing Rule', 'Antenna Ratio Rule', 'Latch-up Prevention Rule', 'Minimum Enclosure Rule']),
        answer: 'Minimum Spacing Rule',
        timeLimit: 30,
        basePoints: 15,
        imageUrl: ''
      },
      {
        id: 'q-b3-2',
        game: 'brain',
        round: 3,
        question: 'What is Moore’s Law primarily related to in semiconductor engineering?',
        type: 'Semiconductor Industry',
        options: JSON.stringify([
          'Doubling of transistors on a microchip approximately every 2 years',
          'Halving of computer memory storage capacity every year',
          'Clock frequency quadrupling every 6 months',
          'Total power consumption halving every decade'
        ]),
        answer: 'Doubling of transistors on a microchip approximately every 2 years',
        timeLimit: 30,
        basePoints: 15,
        imageUrl: ''
      },
      {
        id: 'q-b3-3',
        game: 'brain',
        round: 3,
        question: 'Which Hardware Description Language (HDL) is universally standard in modern ASIC/FPGA digital design?',
        type: 'Digital Hardware Design',
        options: JSON.stringify(['Verilog / VHDL', 'HTML / CSS', 'Python / Django', 'SQL / SQLite']),
        answer: 'Verilog / VHDL',
        timeLimit: 30,
        basePoints: 15,
        imageUrl: ''
      },
      {
        id: 'q-b3-4',
        game: 'brain',
        round: 3,
        question: 'In flip-flop timing analysis, what is the minimum time data must remain stable BEFORE the active clock edge?',
        type: 'Sequential Timing',
        options: JSON.stringify(['Setup Time (Tsetup)', 'Hold Time (Thold)', 'Propagation Delay (Tpd)', 'Clock Jitter']),
        answer: 'Setup Time (Tsetup)',
        timeLimit: 30,
        basePoints: 15,
        imageUrl: ''
      }
    ];

    for (const q of additionalBrainQuestions) {
      insertQ.run(
        q.id,
        q.game,
        q.round,
        q.question,
        q.type,
        q.options,
        q.answer,
        q.timeLimit,
        q.basePoints,
        q.imageUrl,
        new Date().toISOString()
      );
    }
  }

  // Verify and ensure official Brain Round 2 questions are synced
  const brainR2OfficialCheck = db.prepare("SELECT id FROM questions WHERE game = 'brain' AND round = 2 AND question LIKE '%parallel AI calculations%'").get();
  if (!brainR2OfficialCheck) {
    console.log('[DB Sync] Syncing official Round 2 MCQs for Engineer’s Brain...');
    db.prepare("DELETE FROM questions WHERE game = 'brain' AND round = 2").run();
    const insertQ = db.prepare(`
      INSERT INTO questions 
      (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const r2Questions = [
      {
        id: 'q-b2-1',
        game: 'brain',
        round: 2,
        question: 'Which hardware is especially designed for parallel AI calculations?',
        type: 'Multiple Choice',
        options: JSON.stringify(['GPU', 'Keyboard', 'Printer', 'Relay']),
        answer: 'GPU',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-2',
        game: 'brain',
        round: 2,
        question: 'A combinational circuit has no:',
        type: 'Multiple Choice',
        options: JSON.stringify(['Inputs', 'Outputs', 'Memory', 'Logic gates']),
        answer: 'Memory',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-3',
        game: 'brain',
        round: 2,
        question: 'if x + (1/x) = 3 ,  then find  [ x^2 + (1/x^2) ]',
        type: 'Multiple Choice',
        options: JSON.stringify(['5', '10', '7', '9']),
        answer: '7',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-4',
        game: 'brain',
        round: 2,
        question: 'A combinational circuit has 4 inputs and 2 outputs. Which device could perform this function?',
        type: 'Multiple Choice',
        options: JSON.stringify(['4-to-2 Decoder', '4-to-2 Encoder', '4-bit Counter', '2-bit Comparator']),
        answer: '4-to-2 Encoder',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-5',
        game: 'brain',
        round: 2,
        question: 'Which memory is volatile?',
        type: 'Multiple Choice',
        options: JSON.stringify(['ROM', 'Flash memory', 'RAM', 'EEPROM']),
        answer: 'RAM',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-6',
        game: 'brain',
        round: 2,
        question: 'Two Capacitor of 6 farad  each are connected in parallel. Their equivalent resistance is:',
        type: 'Multiple Choice',
        options: JSON.stringify(['12 farad', '6 farad', '3 farad', '1.5 farad']),
        answer: '12 farad',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      }
    ];

    for (const q of r2Questions) {
      insertQ.run(
        q.id,
        q.game,
        q.round,
        q.question,
        q.type,
        q.options,
        q.answer,
        q.timeLimit,
        q.basePoints,
        q.imageUrl,
        new Date().toISOString()
      );
    }
  }

  // Update initial ranks based on score
  updateRanks('brain');
  updateRanks('pictionary');
}

export function updateRanks(game) {
  try {
    const teams = db.prepare(`
      SELECT id, score, 
        (SELECT count(*) FROM answers WHERE team_id = teams.id AND is_correct = 1) as correct_count,
        (SELECT coalesce(sum(response_time), 9999) FROM answers WHERE team_id = teams.id) as total_time
      FROM teams 
      WHERE (game = ? OR game = 'both') AND (is_deleted = 0 OR is_deleted IS NULL)
      ORDER BY score DESC, correct_count DESC, total_time ASC
    `).all(game);

    const updateRankStmt = db.prepare('UPDATE teams SET rank = ? WHERE id = ?');
    teams.forEach((t, index) => {
      updateRankStmt.run(index + 1, t.id);
    });
  } catch (err) {
    console.error('Error updating ranks:', err);
  }
}

const backupDir = path.join(__dirname, 'data');
const backupFilePath = path.join(backupDir, 'persistent_teams.json');

/**
 * Save all active teams into persistent JSON backup file
 */
export function savePersistentTeamsBackup(teamsList = null) {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const teamsToSave = teamsList || db.prepare('SELECT * FROM teams WHERE (is_deleted = 0 OR is_deleted IS NULL)').all();
    fs.writeFileSync(backupFilePath, JSON.stringify(teamsToSave, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Persistent Teams Backup Error]:', err.message);
  }
}

/**
 * Restore teams from persistent JSON backup file into SQLite if missing
 */
export function restoreTeamsFromBackup() {
  try {
    if (!fs.existsSync(backupFilePath)) return;
    const raw = fs.readFileSync(backupFilePath, 'utf-8');
    const teams = JSON.parse(raw);
    if (!Array.isArray(teams) || teams.length === 0) return;

    const existingRows = db.prepare('SELECT id, team_name FROM teams').all();
    const existingIds = new Set(existingRows.map(r => r.id));
    const existingNames = new Set(existingRows.map(r => r.team_name ? r.team_name.toLowerCase() : ''));

    const insertStmt = db.prepare(`
      INSERT INTO teams (
        id, team_name, game, captain, member1, member2, member3, contact,
        password_hash, registration_status, score, rank, status, is_seed, is_deleted, deleted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let restoredCount = 0;
    for (const t of teams) {
      if (!existingIds.has(t.id) && !existingNames.has(t.team_name.toLowerCase())) {
        insertStmt.run(
          t.id,
          t.team_name,
          t.game || 'brain',
          t.captain || 'Captain',
          t.member1 || t.captain || 'Member 1',
          t.member2 || 'Member 2',
          t.member3 || 'Member 3',
          t.contact || 'N/A',
          t.password_hash || null,
          t.registration_status || 'VERIFIED',
          t.score || 0,
          t.rank || 0,
          t.status || 'REGISTERED',
          t.is_seed || 0,
          t.is_deleted || 0,
          t.deleted_at || null,
          t.created_at || new Date().toISOString()
        );
        restoredCount++;
        existingIds.add(t.id);
        existingNames.add(t.team_name.toLowerCase());
      }
    }

    if (restoredCount > 0) {
      console.log(`🛡️ [Persistence Shield] Restored ${restoredCount} persistent squad registrations into website SQLite database.`);
    }
  } catch (err) {
    console.warn('[Persistent Teams Restore Error]:', err.message);
  }
}

export default db;

