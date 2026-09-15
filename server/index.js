import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db, { initDB, updateRanks } from './db.js';
import { setupSocketIO, broadcastScoreboard } from './socketHandler.js';
import { startContinuousSync } from './mysqlSync.js';

import authRoutes from './routes/authRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('🔥 [CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite DB
try {
  initDB();
  console.log('✅ SQLite database initialized and seeded successfully.');
} catch (err) {
  console.error('❌ Failed to initialize SQLite database:', err);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);


// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
setupSocketIO(io);

// Start continuous two-way sync between MySQL and website SQLite
startContinuousSync(db, broadcastScoreboard, updateRanks, 3000);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static public & uploads folder
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/export', exportRoutes);

// Health check & overview stats
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    event: "Engineer's Day 2026",
    developer: 'Aditya Shinde',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build in production if available
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/socket.io') && !req.url.startsWith('/uploads')) {
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred'
  });
});

const PORT = process.env.PORT || 5000;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️ Port ${PORT} is already in use by another process.`);
    console.error(`To release port ${PORT} on Windows, run: taskkill /IM node.exe /F\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`⚡ ENGINEER'S DAY 2026 BACKEND SERVER RUNNING`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`👤 Platform Developed By: Aditya Shinde`);
  console.log(`====================================================`);
});

// Graceful shutdown on Ctrl+C and SIGTERM to prevent 3221225786 exit error
process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 500).unref();
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 500).unref();
});
