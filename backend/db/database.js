import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';

let mongod = null;

export const initDb = async () => {
  let uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`Connecting to MongoDB at: ${uri}...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log('MongoDB connected successfully');
    } catch (err) {
      console.warn(`[Database Warning] Failed to connect to external MongoDB: ${err.message}`);
    }
  }

  // Attempt MongoMemoryServer if not connected
  if (mongoose.connection.readyState !== 1) {
    try {
      console.log('Starting local MongoMemoryServer fallback...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully (In-Memory Sandbox)');
    } catch (memErr) {
      console.warn('In-memory MongoDB download unavailable, running in static API fallback mode.');
    }
  }

  // Seed default data if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const settingsCount = await Setting.countDocuments();
      if (settingsCount === 0) {
        console.log('Seeding default system settings...');
        const defaultSettings = [
          { key: 'business_name', value: "Mani's Kote Factory" },
          { key: 'tagline', value: 'Customize Your Happiness' },
          { key: 'contact_email', value: 'concierge@maniskotefactory.com' },
          { key: 'contact_phone', value: '+1 (800) COCOA-LUXE' },
          { key: 'contact_address', value: '700 Cocoa Boulevard, Suite 100, Chocolate District, Hershey PA 17033' },
          { key: 'delivery_zones', value: '[]' },
          { key: 'announcement_banner', value: '' },
          { key: 'brand_logo_url', value: '/uploads/images/brand_logo.png' },
          { key: 'instagram_username', value: 'maniskote' },
          { key: 'payment_qr_code', value: '/assets/qr-placeholder.png' },
          { key: 'payment_instructions', value: 'Scan the QR code below using any UPI app and enter UTR code.' }
        ];
        await Setting.insertMany(defaultSettings);
        console.log('System settings seeded.');
      }

      const usersCount = await User.countDocuments();
      if (usersCount === 0) {
        console.log('Seeding default user accounts...');
        const userHash = await bcrypt.hash('userpassword123', 10);
        const ownerHash = await bcrypt.hash('ownerpassword123', 10);
        const mwcHash = await bcrypt.hash('mwcpassword123', 10);

        await User.insertMany([
          { name: 'Audrey Hepburn', email: 'user@manis.com', password_hash: userHash, role: 'user', status: 'active' },
          { name: 'Mani Kote', email: 'owner@manis.com', password_hash: ownerHash, role: 'owner', status: 'active' },
          { name: 'MWC Developer', email: 'mwc@manis.com', password_hash: mwcHash, role: 'mwc', status: 'active' }
        ]);
        console.log('User accounts seeded.');
      }
    } catch (seedErr) {
      console.error('Error seeding initial data to MongoDB:', seedErr);
    }
  }
};

export const query = async (sql, params = []) => [];
export const queryOne = async (sql, params = []) => null;
export const execute = async (sql, params = []) => ({ id: null, changes: 0 });

export default mongoose.connection;
