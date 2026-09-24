import app from '../backend/server.js';
import { initDb } from '../backend/db/database.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDb();
      isDbInitialized = true;
    } catch (err) {
      console.error('Vercel DB Init Error:', err);
    }
  }
  return app(req, res);
}
