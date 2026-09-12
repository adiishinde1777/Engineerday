import express from 'express';
import db from '../db.js';
import { requireAdmin } from '../auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `faculty-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });
const router = express.Router();

// GET all faculty
router.get('/', (req, res) => {
  const faculty = db.prepare('SELECT * FROM faculty ORDER BY created_at ASC').all();
  return res.json({ success: true, count: faculty.length, faculty });
});

// POST add faculty (Admin)
router.post('/', requireAdmin, (req, res) => {
  const { name, designation, department, profile_image, description, position_role } = req.body;
  if (!name || !designation || !department) {
    return res.status(400).json({ success: false, message: 'Name, designation/position, and department are required' });
  }

  const id = `fac-${Date.now()}`;
  db.prepare(`
    INSERT INTO faculty (id, name, designation, department, profile_image, description, position_role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name.trim(),
    designation.trim(),
    department.trim(),
    profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    description || '',
    position_role || 'Faculty Member',
    new Date().toISOString()
  );

  return res.status(201).json({ success: true, message: 'Faculty member added successfully', id });
});

// POST upload faculty image
router.post('/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ success: true, imageUrl });
});

// PUT update faculty (Admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { name, designation, department, profile_image, description, position_role } = req.body;
  const existing = db.prepare('SELECT id FROM faculty WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Faculty member not found' });
  }

  db.prepare(`
    UPDATE faculty SET
      name = coalesce(?, name),
      designation = coalesce(?, designation),
      department = coalesce(?, department),
      profile_image = coalesce(?, profile_image),
      description = coalesce(?, description),
      position_role = coalesce(?, position_role)
    WHERE id = ?
  `).run(name, designation, department, profile_image, description, position_role, req.params.id);

  return res.json({ success: true, message: 'Faculty member updated successfully' });
});

// DELETE faculty (Admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM faculty WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Faculty member not found' });
  }
  db.prepare('DELETE FROM faculty WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Faculty member removed successfully' });
});

export default router;
