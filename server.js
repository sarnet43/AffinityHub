const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(ROOT_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'asset';
    const uniqueName = `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
      return;
    }
    cb(null, true);
  }
});

function getDefaultStore() {
  return {
    config: null,
    affection: 50,
    updatedAt: null
  };
}

function readStore() {
  if (!fs.existsSync(STORE_FILE)) return getDefaultStore();

  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return { ...getDefaultStore(), ...JSON.parse(raw) };
  } catch (error) {
    console.error('저장 파일을 읽는 중 오류가 발생했습니다.', error);
    return getDefaultStore();
  }
}

function writeStore(payload) {
  const store = {
    ...getDefaultStore(),
    ...payload,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  return store;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: 'server', updatedAt: new Date().toISOString() });
});

app.get('/api/config', (_req, res) => {
  res.json(readStore());
});

app.post('/api/config', (req, res) => {
  const { config, affection } = req.body || {};
  const nextStore = writeStore({
    config: config ?? null,
    affection: Number.isFinite(Number(affection)) ? Number(affection) : 50
  });
  res.json({ ok: true, ...nextStore });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ ok: false, message: '업로드된 파일이 없습니다.' });
    return;
  }

  res.json({
    ok: true,
    fileName: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(400).json({
    ok: false,
    message: error.message || '요청 처리 중 오류가 발생했습니다.'
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AffinityHub server listening on http://localhost:${PORT}`);
});
