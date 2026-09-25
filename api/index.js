/**
 * Vercel Serverless Entry Point
 * 
 * This file is the single serverless function that handles ALL /api/* requests.
 * It builds its own Express app WITHOUT importing server.js to avoid
 * WebSocket / http.createServer crashes in the Vercel serverless environment.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from '../backend/db/database.js';

// Import all route modules
import authRouter from '../backend/routes/auth.js';
import productsRouter from '../backend/routes/products.js';
import ordersRouter from '../backend/routes/orders.js';
import ownerRouter from '../backend/routes/owner.js';
import mwcRouter from '../backend/routes/mwc.js';
import jobsRouter from '../backend/routes/jobs.js';
import Setting from '../backend/models/Setting.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Build Express App ────────────────────────────────────────────────────────
const app = express();

// CORS — allow all .vercel.app origins + localhost dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/mwc', mwcRouter);
app.use('/api/jobs', jobsRouter);

// Public settings endpoint
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Setting.find({});
    const rows = {};
    settings.forEach(s => { rows[s.key] = s.value; });
    return res.json({
      business_name: rows.business_name || "Kote Factory",
      tagline: rows.tagline || 'Customize Your Happiness',
      contact_email: rows.contact_email || 'manisales.international@gmail.com',
      contact_phone: rows.contact_phone || '8660801536',
      contact_address: rows.contact_address || 'https://maps.app.goo.gl/J25KDX7R3QEmaeHj7?g_st=iwb',
      delivery_zones: rows.delivery_zones ? JSON.parse(rows.delivery_zones) : [],
      announcement_banner: rows.announcement_banner || '',
      brand_logo_url: rows.brand_logo_url || '/uploads/images/brand_logo.png',
      instagram_username: rows.instagram_username || 'maniskote',
      payment_qr_code: rows.payment_qr_code || '/assets/qr-placeholder.png',
      payment_instructions: rows.payment_instructions || 'Scan QR and pay...',
      google_maps_api_key: process.env.GOOGLE_MAPS_API_KEY || ''
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ message: 'Error loading store metadata.' });
  }
});

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: "Mani's Kote Factory API is running on Vercel." });
});

// Broadcast stub — owner routes call app.get('broadcastOwnerMessage')
// In serverless we cannot do WebSockets, so we provide a no-op
app.set('broadcastOwnerMessage', () => {});

// ─── DB init (cached across warm invocations) ────────────────────────────────
let dbInitialized = false;

// ─── Vercel Serverless Handler ────────────────────────────────────────────────
export default async function handler(req, res) {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (err) {
      console.error('DB Init Error:', err.message);
      // Continue anyway — DB errors handled per-route
    }
  }
  return app(req, res);
}
