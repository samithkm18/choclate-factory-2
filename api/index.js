const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.set('broadcastOwnerMessage', () => {});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let appLoaded = false;
let authRouter, productsRouter, ordersRouter, ownerRouter, mwcRouter, jobsRouter, Setting, initDb;

app.use(async (req, res, next) => {
  if (!appLoaded) {
    try {
      const dbModule = await import('../backend/db/database.js');
      initDb = dbModule.initDb;

      const authMod = await import('../backend/routes/auth.js');
      authRouter = authMod.default;

      const prodMod = await import('../backend/routes/products.js');
      productsRouter = prodMod.default;

      const ordMod = await import('../backend/routes/orders.js');
      ordersRouter = ordMod.default;

      const ownMod = await import('../backend/routes/owner.js');
      ownerRouter = ownMod.default;

      const mwcMod = await import('../backend/routes/mwc.js');
      mwcRouter = mwcMod.default;

      const jobMod = await import('../backend/routes/jobs.js');
      jobsRouter = jobMod.default;

      const setMod = await import('../backend/models/Setting.js');
      Setting = setMod.default;

      await initDb();
      appLoaded = true;
    } catch (err) {
      console.error('App Load Error:', err);
      return res.status(500).json({ error: 'Backend Initialization Error', message: err.message, stack: err.stack });
    }
  }

  // Handle routes
  const path = req.path;
  if (path.startsWith('/api/auth') || path.startsWith('/auth')) {
    return authRouter(req, res, next);
  }
  if (path.startsWith('/api/products') || path.startsWith('/products')) {
    return productsRouter(req, res, next);
  }
  if (path.startsWith('/api/orders') || path.startsWith('/orders')) {
    return ordersRouter(req, res, next);
  }
  if (path.startsWith('/api/owner') || path.startsWith('/owner')) {
    return ownerRouter(req, res, next);
  }
  if (path.startsWith('/api/mwc') || path.startsWith('/mwc')) {
    return mwcRouter(req, res, next);
  }
  if (path.startsWith('/api/jobs') || path.startsWith('/jobs')) {
    return jobsRouter(req, res, next);
  }
  if (path === '/api/settings' || path === '/settings') {
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
      return res.status(500).json({ message: 'Error loading store metadata.' });
    }
  }

  next();
});

app.get(['/api', '/'], (req, res) => {
  res.json({ status: 'ok', message: "Mani's Kote Factory API is running on Vercel." });
});

module.exports = app;
