import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';

let isConnecting = false;

export const initDb = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;

  const DEFAULT_ATLAS_URI = 'mongodb+srv://samithkm18:samithkm18@cluster0.jnwsf8z.mongodb.net/kotechocolate?retryWrites=true&w=majority';
  const uri = process.env.MONGODB_URI || DEFAULT_ATLAS_URI;

  try {
    console.log('Connecting to MongoDB Atlas database...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected successfully.');
  } catch (err) {
    console.warn(`[Database Warning] Connection failed: ${err.message}`);
  } finally {
    isConnecting = false;
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

      const existingOwner = await User.findOne({ email: 'kotefactory@gmail.com' });
      if (!existingOwner) {
        console.log('Seeding owner account (kotefactory@gmail.com)...');
        const ownerHash = await bcrypt.hash('passwordkotefactory', 10);
        await User.create({
          name: 'Mani Kote Owner',
          email: 'kotefactory@gmail.com',
          password_hash: ownerHash,
          role: 'owner',
          status: 'active'
        });
      }

      const usersCount = await User.countDocuments();
      if (usersCount <= 1) {
        console.log('Seeding remaining default user accounts...');
        const userHash = await bcrypt.hash('userpassword123', 10);
        const mwcHash = await bcrypt.hash('mwcpassword123', 10);

        const existingUser = await User.findOne({ email: 'user@manis.com' });
        if (!existingUser) {
          await User.create({ name: 'Audrey Hepburn', email: 'user@manis.com', password_hash: userHash, role: 'user', status: 'active' });
        }
        const existingMwc = await User.findOne({ email: 'mwc@manis.com' });
        if (!existingMwc) {
          await User.create({ name: 'MWC Developer', email: 'mwc@manis.com', password_hash: mwcHash, role: 'mwc', status: 'active' });
        }
        console.log('User accounts ready.');
      }
    } catch (seedErr) {
      console.error('Error seeding initial data to MongoDB:', seedErr);
    }
  }
};

export const query = async () => [];
export const queryOne = async () => null;
export const execute = async () => ({ id: null, changes: 0 });

export default mongoose.connection;
