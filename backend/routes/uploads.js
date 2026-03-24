const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not allowed`));
  }
});

router.post('/:projectId', authenticate, upload.array('files', 10), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const inserted = [];
  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase();
    let fileType = 'document';
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) fileType = 'visual';
    if (['.ppt', '.pptx', '.pdf'].includes(ext)) fileType = 'presentation';

    const id = uuidv4();
    db.prepare('INSERT INTO project_files (id, project_id, file_name, file_path, file_type, mime_type, size) VALUES (?,?,?,?,?,?,?)')
      .run(id, req.params.projectId, file.originalname, file.filename, fileType, file.mimetype, file.size);
    inserted.push(db.prepare('SELECT * FROM project_files WHERE id = ?').get(id));
  }
  res.status(201).json(inserted);
});

router.delete('/:projectId/:fileId', authenticate, (req, res) => {
  const file = db.prepare('SELECT pf.*, p.user_id FROM project_files pf JOIN projects p ON pf.project_id = p.id WHERE pf.id = ?').get(req.params.fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });
  if (file.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const fs = require('fs');
  const filePath = path.join(__dirname, '../uploads', file.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM project_files WHERE id = ?').run(req.params.fileId);
  res.json({ message: 'Deleted' });
});

module.exports = router;
