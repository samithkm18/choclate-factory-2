// Load .env FIRST — must be before all route imports in ESM
import './env.js';
// Server entrypoint restarted with port 8191 MongoDB URI

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';


// Import db init
import { initDb, queryOne } from './db/database.js';

// Import routers
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import ownerRouter from './routes/owner.js';
import mwcRouter from './routes/mwc.js';
import jobsRouter from './routes/jobs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'manis_luxury_chocolate_secret_key_2026_rfv_tgb';

// Express Application setup
const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Allow in non-production or fallback
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Serve static assets (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Add local assets folders if needed
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Register REST API endpoints
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
import Setting from './models/Setting.js';

app.use('/api/owner', ownerRouter);
app.use('/api/mwc', mwcRouter);
app.use('/api/jobs', jobsRouter);

// Public settings route (for footer/about page)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Setting.find({});
    const rows = {};
    settings.forEach(s => {
      rows[s.key] = s.value;
    });
    
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
    console.error('Error fetching global settings:', error);
    return res.status(500).json({ message: 'Error loading store metadata.' });
  }
});

// Root check endpoint
app.get('/', (req, res) => {
  res.json({ message: "Mani's Kote Factory API Server is running." });
});

// Create HTTP Server
const server = http.createServer(app);

// Create WebSocket Server
const wss = new WebSocketServer({ noServer: true });

// Active owner WS client sockets
const connectedOwners = new Set();

wss.on('connection', (ws, request, user) => {
  console.log(`WebSocket connected: Owner authenticated as ${user.email} (${user.id})`);
  connectedOwners.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message from owner:', data);
      
      // Ping check
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (err) {
      console.error('WS parsing message error:', err);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed.');
    connectedOwners.delete(ws);
  });
});

// Upgrade HTTP to WS connection with JWT Authorization verification
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user role
    if (decoded.role !== 'owner' && decoded.role !== 'mwc') {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, decoded);
    });
  } catch (error) {
    console.error('WS upgrade verification failed:', error);
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

// Broadcaster utility for new order alerts
const broadcastOwnerMessage = (data) => {
  const stringified = JSON.stringify(data);
  connectedOwners.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(stringified);
    }
  });
};

// Expose broadcaster to express app
app.set('broadcastOwnerMessage', broadcastOwnerMessage);

// Initialize DB and Start listening (only when run directly, not when imported as Vercel handler)
const startServer = async () => {
  try {
    await initDb();
    server.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`WS server available on same port (upgrade)`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
