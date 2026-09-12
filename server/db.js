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
      registration_status TEXT NOT NULL DEFAULT 'VERIFIED',
      score INTEGER NOT NULL DEFAULT 0,
      rank INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'REGISTERED',
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faculty (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      profile_image TEXT,
      description TEXT,
      position_role TEXT,
      created_at TEXT NOT NULL
    );
  `);

  try {
    db.exec('ALTER TABLE faculty ADD COLUMN position_role TEXT;');
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
      is_paused INTEGER NOT NULL DEFAULT 0
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
    { key: 'eventDate', value: '2026-09-15T09:00:00' },
    { key: 'eventSubtitle', value: 'Think. Create. Solve. Engineer the Future.' },
    { key: 'departmentName', value: 'Department of Electronics Engineering (VLSI Design and Technology)' },
    { key: 'eventDescription', value: 'Organized by the Department of Electronics Engineering (VLSI Design and Technology). Celebrating Bharat Ratna Sir M. Visvesvaraya with premier technical showdowns: Engineer’s Brain and Engineering Pictionary.' },
    { key: 'googleFormUrl', value: 'https://forms.gle/Wz7TfiFHX1hNsakb8' },
    { key: 'eventStatus', value: 'AUTO' }, // AUTO, UPCOMING, LIVE, COMPLETED
    { key: 'footerText', value: 'Engineers’ Day 2026 | Designed & Developed by Aditya Shinde' },
    { key: 'developerName', value: 'Aditya Shinde' },
    { key: 'winnersFinalized', value: 'false' },
    { key: 'reportingInstructions', value: 'All team members must report at the Technical Hub 30 minutes prior to round 1 with valid college ID cards.' }
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
  insertScoring.run('brain', 10, 30, 0, 5, 4, 3, 2, 1, 0, 'correct_then_time');
  insertScoring.run('pictionary', 10, 30, 0, 5, 4, 3, 2, 1, 0, 'correct_then_time');

  // Game sessions initialize
  const insertSession = db.prepare(`
    INSERT OR IGNORE INTO game_sessions (game, round, status, timer_remaining, is_paused)
    VALUES (?, 1, 'IDLE', 30, 0)
  `);
  insertSession.run('brain');
  insertSession.run('pictionary');

  // Reset & Seed Department Faculty: Electronics Engineering (VLSI Design and Technology)
  const seedFaculty = [
    {
      id: 'fac-1',
      name: 'Dr. Shrikant Honde',
      designation: 'Head of Department & Professor',
      department: 'Electronics Engineering (VLSI Design & Technology)',
      position_role: 'Head of Department (HOD) & Patron',
      profile_image: '',
      description: 'Head of Department leading VLSI Design, Semiconductor Systems, and symposium mentorship.'
    },
    {
      id: 'fac-2',
      name: 'Prof. T. A. Mohije',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design & Technology)',
      position_role: 'Faculty Convener',
      profile_image: '',
      description: 'Specializes in Digital Electronics, ASIC design flows, and symposium coordination.'
    },
    {
      id: 'fac-3',
      name: 'Mrs. Komal Dandge',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design & Technology)',
      position_role: 'Faculty Coordinator',
      profile_image: '',
      description: 'Expertise in Semiconductor Devices, Analog VLSI, and event management.'
    },
    {
      id: 'fac-4',
      name: 'Prof. G. G. Patil',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design & Technology)',
      position_role: 'Technical Jury & Evaluator',
      profile_image: '',
      description: 'Focuses on Microcontroller Architectures, Embedded Systems, and quiz evaluation.'
    },
    {
      id: 'fac-5',
      name: 'Prof. R. M. Chudiwal',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design & Technology)',
      position_role: 'Event Coordinator',
      profile_image: '',
      description: 'Specializes in FPGA Synthesis, Hardware Verification, and student mentoring.'
    },
    {
      id: 'fac-6',
      name: 'Prof. P. N. Kathar',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design & Technology)',
      position_role: 'Faculty Coordinator',
      profile_image: '',
      description: 'Focuses on Electronic Circuit Analysis, Signal Processing, and stage orchestration.'
    },
    {
      id: 'fac-7',
      name: 'Prof. G. R. Bhalekar',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design & Technology)',
      position_role: 'Technical Advisor',
      profile_image: '',
      description: 'Expertise in VLSI Layout Design, CMOS Technology, and technical competitions.'
    }
  ];

  // Refresh faculty to ensure exact requested members
  const checkHOD = db.prepare("SELECT count(*) as count FROM faculty WHERE name LIKE '%Shrikant Honde%'").get();
  if (!checkHOD || checkHOD.count === 0) {
    db.prepare('DELETE FROM faculty').run();
    const insertFaculty = db.prepare(`
      INSERT INTO faculty (id, name, designation, department, profile_image, description, position_role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const f of seedFaculty) {
      insertFaculty.run(f.id, f.name, f.designation, f.department, f.profile_image, f.description, f.position_role, new Date().toISOString());
    }
  }

  // Clean teams state: No demo teams seeded (teams are only created when users register or admin adds them)


  // Seed Questions for Engineer's Brain & Engineering Pictionary
  const qCheck = db.prepare('SELECT count(*) as count FROM questions').get();
  if (!qCheck || qCheck.count === 0) {
    const insertQ = db.prepare(`
      INSERT INTO questions 
      (id, game, round, question, type, options_json, correct_answer, time_limit, base_points, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedQuestions = [
      // BRAIN ROUND 1 (General Tech & Fast MCQs)
      {
        id: 'q-b1-1',
        game: 'brain',
        round: 1,
        question: 'Who is regarded as the Father of Indian Engineering, whose birthday is celebrated as Engineers’ Day on 15th September?',
        type: 'Multiple Choice',
        options: JSON.stringify(['Dr. A. P. J. Abdul Kalam', 'Sir Mokshagundam Visvesvaraya', 'E. Sreedharan', 'Homi J. Bhabha']),
        answer: 'Sir Mokshagundam Visvesvaraya',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b1-2',
        game: 'brain',
        round: 1,
        question: 'Which legendary 8-bit microprocessor introduced by Intel in 1974 paved the way for the early personal computer era?',
        type: 'Identify Chip',
        options: JSON.stringify(['Intel 8080', 'Intel 4004', 'MOS 6502', 'Motorola 6800']),
        answer: 'Intel 8080',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b1-3',
        game: 'brain',
        round: 1,
        question: 'In digital electronics, what logic gate produces an output of HIGH (1) only when an odd number of inputs are HIGH?',
        type: 'Identify Component',
        options: JSON.stringify(['NAND Gate', 'NOR Gate', 'XOR Gate', 'XNOR Gate']),
        answer: 'XOR Gate',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b1-4',
        game: 'brain',
        round: 1,
        question: 'Moore’s Law originally observed that the number of transistors on a microchip doubles roughly every how many years/months?',
        type: 'Multiple Choice',
        options: JSON.stringify(['6 Months', '2 Years (18-24 Months)', '5 Years', '10 Years']),
        answer: '2 Years (18-24 Months)',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },

      // BRAIN ROUND 2 (Image Identification & Engineering Logic)
      {
        id: 'q-b2-1',
        game: 'brain',
        round: 2,
        question: 'Identify this iconic passive circuit component that stores electrical energy in a magnetic field when electric current flows through it.',
        type: 'Identify Component',
        options: JSON.stringify(['Capacitor', 'Inductor (Choke)', 'Potentiometer', 'Varistor']),
        answer: 'Inductor (Choke)',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'q-b2-2',
        game: 'brain',
        round: 2,
        question: 'What is the time complexity of searching for an element in a balanced Binary Search Tree (AVL / Red-Black Tree)?',
        type: 'Logical Reasoning',
        options: JSON.stringify(['O(1)', 'O(n)', 'O(log n)', 'O(n log n)']),
        answer: 'O(log n)',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },
      {
        id: 'q-b2-3',
        game: 'brain',
        round: 2,
        question: 'In modern VLSI fabrication, what is the revolutionary 3D transistor architecture introduced to overcome planar MOSFET leakage?',
        type: 'Technology Identification',
        options: JSON.stringify(['Bipolar Junction Transistor', 'FinFET (3D Tri-Gate)', 'Vacuum Tube', 'Relay Logic']),
        answer: 'FinFET (3D Tri-Gate)',
        timeLimit: 30,
        basePoints: 10,
        imageUrl: ''
      },

      // BRAIN ROUND 3 (Rapid Grand Finale)
      {
        id: 'q-b3-1',
        game: 'brain',
        round: 3,
        question: 'Which fundamental theorem states that a continuous-time signal can be completely represented and reconstructed if sampled at twice its maximum frequency?',
        type: 'Multiple Choice',
        options: JSON.stringify(['Nyquist-Shannon Theorem', 'Fourier Transform Principle', 'Heisenberg Theorem', 'Thevenin Theorem']),
        answer: 'Nyquist-Shannon Theorem',
        timeLimit: 30,
        basePoints: 15,
        imageUrl: ''
      },
      {
        id: 'q-b3-2',
        game: 'brain',
        round: 3,
        question: 'True or False: Quantum computers use traditional binary bits (0 or 1) only, but execute operations at 10x clock speed.',
        type: 'True/False',
        options: JSON.stringify(['True', 'False (They use Qubits with Superposition)']),
        answer: 'False (They use Qubits with Superposition)',
        timeLimit: 25,
        basePoints: 15,
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
      WHERE game = ?
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

export default db;
