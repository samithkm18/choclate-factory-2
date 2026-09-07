import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';

let mongod = null;

export const initDb = async () => {
  let uri = process.env.MONGODB_URI;

  try {
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }
    
    console.log(`Connecting to MongoDB at: ${uri}...`);
    // Attempt standard connection with 3 seconds timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.warn(`\n[Database Warning] Failed to connect to external MongoDB: ${err.message}`);
    console.log('Starting local MongoMemoryServer fallback to ensure zero connection errors...');
    
    try {
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log(`MongoMemoryServer started successfully at dynamic URI: ${uri}`);
      
      // Connect to the in-memory database
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully (In-Memory Sandbox)');
    } catch (memErr) {
      console.error('CRITICAL: Failed to initialize in-memory fallback MongoDB:', memErr);
      process.exit(1);
    }
  }

  // Seed default data
  try {
    // Seed default settings if empty
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
        { key: 'brand_logo_url', value: '' },
        { key: 'instagram_username', value: 'maniskote' },
        { key: 'payment_qr_code', value: '/assets/qr-placeholder.png' },
        { key: 'payment_instructions', value: 'Scan the QR code below using any UPI app (PhonePe, Google Pay, Paytm, etc.), complete the transfer for the total order amount, and enter the transaction reference (UTR) below for manual verification.' }
      ];
      await Setting.insertMany(defaultSettings);
      console.log('System settings seeded.');
    }

    // Seed default users if empty
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

    // Seed default luxury chocolates if empty
    const productsCount = await Product.countDocuments();
    if (productsCount === 0) {
      console.log('Seeding initial luxury chocolates...');
      const defaultChocolates = [
        {
          name: 'Dark Cocoa Eclipse',
          slug: 'dark-cocoa-eclipse',
          description: 'A stellar dark chocolate crafted from 80% single-origin Venezuelan Criollo cocoa. Features deep, mysterious notes of black cherry, roasted espresso, and a finish accented with delicate, edible 24k gold foil.',
          price: 24.50,
          stock: 120,
          category: 'Dark Chocolate',
          dietary_tags: ['vegan', 'gluten-free', 'organic'],
          flavor_profile: { cocoa: 80, sweetness: 1, notes: ['espresso', 'black cherry', 'smoke'] },
          video_url: '',
          fallback_ingredients: ['Organic Cocoa Mass', 'Organic Cocoa Butter', 'Demerara Sugar', 'Edible 24k Gold Foil'],
          images: ['/assets/products/eclipse-1.jpg'],
          is_spotlight: true
        },
        {
          name: 'Golden Truffle Symphony',
          slug: 'golden-truffle-symphony',
          description: 'Our signature creamy milk chocolate truffle bar infused with wild honeycomb crunch, Fleur de Sel sea salt flakes, and layered with liquid gold-caramel filling.',
          price: 28.00,
          stock: 85,
          category: 'Milk Chocolate',
          dietary_tags: ['gluten-free'],
          flavor_profile: { cocoa: 45, sweetness: 4, notes: ['salted caramel', 'honeycomb', 'vanilla'] },
          video_url: '',
          fallback_ingredients: ['Cocoa Butter', 'Whole Milk Powder', 'Sugar', 'Caramelized Honey', 'Fleur de Sel', 'Lecithin'],
          images: ['/assets/products/symphony-1.jpg'],
          is_spotlight: false
        },
        {
          name: 'Mani\'s Raspberry Royale',
          slug: 'manis-raspberry-royale',
          description: 'A stunning white chocolate masterpiece dyed with natural freeze-dried raspberry powder for a rich maroon hue. Dotted with chopped pistachios and crystalized violet petals.',
          price: 26.00,
          stock: 95,
          category: 'White Chocolate',
          dietary_tags: ['gluten-free', 'contains-nuts'],
          flavor_profile: { cocoa: 32, sweetness: 5, notes: ['raspberry tartness', 'pistachio', 'rose'] },
          video_url: '',
          fallback_ingredients: ['Cocoa Butter', 'Cane Sugar', 'Dry Milk Solids', 'Freeze-dried Raspberries', 'Sicilian Pistachios'],
          images: ['/assets/products/raspberry-1.jpg'],
          is_spotlight: false
        },
        {
          name: 'Vegas Bourbon Hazelnut',
          slug: 'vegas-bourbon-hazelnut',
          description: 'A bold, sophisticated blend of 70% dark chocolate barrel-aged in premium Kentucky bourbon casks, loaded with caramelized Italian hazelnuts and smoked oakwood aroma.',
          price: 29.50,
          stock: 60,
          category: 'Dark Chocolate',
          dietary_tags: ['vegan', 'contains-nuts'],
          flavor_profile: { cocoa: 70, sweetness: 2, notes: ['bourbon whiskey', 'roasted hazelnut', 'charred oak'] },
          video_url: '',
          fallback_ingredients: ['Cask-Aged Cocoa Mass', 'Cane Sugar', 'Caramelized Hazelnuts', 'Natural Bourbon Extract'],
          images: ['/assets/products/bourbon-1.jpg'],
          is_spotlight: false
        },
        {
          name: 'Lavender Silk Noir',
          slug: 'lavender-silk-noir',
          description: 'A delicate 72% dark chocolate bar infused with organic French lavender buds and sweetened wild honey notes, offering a floral and relaxing chocolate escape.',
          price: 25.00,
          stock: 75,
          category: 'Dark Chocolate',
          dietary_tags: ['vegan', 'organic'],
          flavor_profile: { cocoa: 72, sweetness: 2, notes: ['floral lavender', 'wild honey', 'dark wood'] },
          video_url: '',
          fallback_ingredients: ['Organic Cocoa Liquor', 'Raw Wild Honey', 'French Lavender Flowers', 'Vanilla Pods'],
          images: ['/assets/products/lavender-1.jpg'],
          is_spotlight: false
        }
      ];
      await Product.insertMany(defaultChocolates);
      console.log('Luxury chocolates seeded.');
    }
  } catch (seedErr) {
    console.error('Error seeding initial data to MongoDB:', seedErr);
  }
};

// SQLite Legacy compatibility
export const query = async (sql, params = []) => {
  console.warn('DEPRECATED: raw query called with SQL:', sql);
  return [];
};
export const queryOne = async (sql, params = []) => {
  console.warn('DEPRECATED: raw queryOne called with SQL:', sql);
  return null;
};
export const execute = async (sql, params = []) => {
  console.warn('DEPRECATED: raw execute called with SQL:', sql);
  return { id: null, changes: 0 };
};

export default mongoose.connection;
