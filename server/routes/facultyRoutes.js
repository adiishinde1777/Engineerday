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
  const faculty = db.prepare('SELECT * FROM faculty ORDER BY is_hod DESC, created_at ASC').all();
  return res.json({ success: true, count: faculty.length, faculty });
});

// POST add faculty (Admin)
router.post('/', requireAdmin, (req, res) => {
  const { name, designation, department, profile_image, description, position_role, is_hod } = req.body;
  if (!name || !designation || !department) {
    return res.status(400).json({ success: false, message: 'Name, designation/position, and department are required' });
  }

  const isHodVal = (is_hod === 1 || is_hod === true || (position_role && position_role.toLowerCase().includes('hod'))) ? 1 : 0;
  if (isHodVal === 1) {
    db.prepare('UPDATE faculty SET is_hod = 0').run();
  }

  const id = `fac-${Date.now()}`;
  db.prepare(`
    INSERT INTO faculty (id, name, designation, department, profile_image, description, position_role, is_hod, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name.trim(),
    designation.trim(),
    department.trim(),
    profile_image || '',
    description || '',
    position_role || (isHodVal ? 'Head of Department (HOD) & Patron' : 'Faculty Member'),
    isHodVal,
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

// POST set specific faculty as HOD (Admin)
router.post('/:id/set-hod', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id, name FROM faculty WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Faculty member not found' });
  }

  db.prepare('UPDATE faculty SET is_hod = 0').run();
  db.prepare(`
    UPDATE faculty 
    SET is_hod = 1, 
        position_role = 'Head of Department (HOD) & Patron' 
    WHERE id = ?
  `).run(req.params.id);

  return res.json({ success: true, message: `${existing.name} is now designated as Head of Department (HOD)` });
});

// PUT update faculty (Admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { name, designation, department, profile_image, description, position_role, is_hod } = req.body;
  const existing = db.prepare('SELECT * FROM faculty WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Faculty member not found' });
  }

  const newImage = profile_image !== undefined ? profile_image : existing.profile_image;
  let newIsHod = existing.is_hod || 0;

  if (is_hod !== undefined) {
    newIsHod = (is_hod === 1 || is_hod === true) ? 1 : 0;
    if (newIsHod === 1) {
      db.prepare('UPDATE faculty SET is_hod = 0 WHERE id != ?').run(req.params.id);
    }
  }

  db.prepare(`
    UPDATE faculty SET
      name = coalesce(?, name),
      designation = coalesce(?, designation),
      department = coalesce(?, department),
      profile_image = ?,
      description = coalesce(?, description),
      position_role = coalesce(?, position_role),
      is_hod = ?
    WHERE id = ?
  `).run(name, designation, department, newImage, description, position_role, newIsHod, req.params.id);

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
