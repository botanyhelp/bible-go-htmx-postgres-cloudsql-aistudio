import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  VOLUMES,
  BOOKS,
  getBooksByVolume,
  getChaptersByBook,
  getVersesByChapter,
  lookupScriptureByTitle,
  lookupScriptureByJoin,
  searchScriptures
} from './src/data/scripturesData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // REST API Endpoints
  // GET /api/v1/volumes
  app.get('/api/v1/volumes', (req: Request, res: Response) => {
    res.json({ success: true, data: VOLUMES });
  });

  // GET /api/v1/books?volume_id=1
  app.get('/api/v1/books', (req: Request, res: Response) => {
    const volumeIdStr = req.query.volume_id as string;
    if (!volumeIdStr) {
      return res.json({ success: true, data: BOOKS });
    }
    const volumeId = parseInt(volumeIdStr, 10);
    const filtered = getBooksByVolume(volumeId);
    res.json({ success: true, data: filtered });
  });

  // GET /api/v1/chapters?book_id=1
  app.get('/api/v1/chapters', (req: Request, res: Response) => {
    const bookIdStr = req.query.book_id as string;
    if (!bookIdStr) {
      return res.status(400).json({ success: false, error: 'book_id is required' });
    }
    const bookId = parseInt(bookIdStr, 10);
    const chapters = getChaptersByBook(bookId);
    res.json({ success: true, data: chapters.map(c => ({ book_id: bookId, chapter_number: c })) });
  });

  // GET /api/v1/verses?chapter_id=1&book_id=1
  app.get('/api/v1/verses', (req: Request, res: Response) => {
    const bookIdStr = req.query.book_id as string || '43'; // Default John
    const chapNumStr = req.query.chapter_number as string || '3';
    const bookId = parseInt(bookIdStr, 10);
    const chapNum = parseInt(chapNumStr, 10);
    const verses = getVersesByChapter(bookId, chapNum);
    res.json({ success: true, data: verses.map(v => ({ chapter_number: chapNum, verse_number: v })) });
  });

  // QUERY 1: GET /api/v1/scriptures?verse_title=John+3:16
  app.get('/api/v1/scriptures', (req: Request, res: Response) => {
    const verseTitle = (req.query.verse_title as string) || 'John 3:16';
    const result = lookupScriptureByTitle(verseTitle);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Scripture verse title not found' });
    }
    res.json({ success: true, data: result });
  });

  // QUERY 2: GET /api/v1/scriptures/lookup?book=John&chapter=3&verse=16
  app.get('/api/v1/scriptures/lookup', (req: Request, res: Response) => {
    const book = (req.query.book as string) || 'John';
    const chapter = parseInt(req.query.chapter as string || '3', 10);
    const verse = parseInt(req.query.verse as string || '16', 10);

    const result = lookupScriptureByJoin(book, chapter, verse);
    res.json({ success: true, data: result });
  });

  // GET /api/v1/search?q=love
  app.get('/api/v1/search', (req: Request, res: Response) => {
    const query = (req.query.q as string) || '';
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query parameter q is required' });
    }
    const results = searchScriptures(query);
    res.json({ success: true, count: results.length, data: results });
  });

  // HTMX Component Simulation Endpoints (Returns HTML option fragments)
  app.get('/htmx/books', (req: Request, res: Response) => {
    const volIdStr = req.query.volume_id as string;
    const volId = parseInt(volIdStr, 10);
    const books = getBooksByVolume(volId);

    let html = `<option value="">-- Select Book --</option>\n`;
    for (const b of books) {
      html += `<option value="${b.id}">${b.book_title}</option>\n`;
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/htmx/chapters', (req: Request, res: Response) => {
    const bookIdStr = req.query.book_id as string;
    const bookId = parseInt(bookIdStr, 10);
    const chapters = getChaptersByBook(bookId);

    let html = `<option value="">-- Select Chapter --</option>\n`;
    for (const c of chapters) {
      html += `<option value="${c}">Chapter ${c}</option>\n`;
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/htmx/verses', (req: Request, res: Response) => {
    const verses = getVersesByChapter(1, 1);
    let html = `<option value="">-- Select Verse --</option>\n`;
    for (const v of verses) {
      html += `<option value="${v}">Verse ${v}</option>\n`;
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // Healthcheck endpoint
  app.get('/healthz', (req: Request, res: Response) => {
    res.json({ status: 'ok', database: 'connected (simulated Cloud SQL PostgreSQL)', time: new Date().toISOString() });
  });

  // Integrate Vite for React client
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
  });
}

startServer();
