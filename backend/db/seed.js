import bcrypt from 'bcryptjs';
import { initDb, execute, query } from './database.js';

const seed = async () => {
  try {
    // 1. Initialize schema
    await initDb();

    console.log('Seeding database...');

    // 2. Seed Default Accounts
    const existingUsers = await query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      console.log('Seeding default users...');
      const userHash = await bcrypt.hash('userpassword123', 10);
      const ownerHash = await bcrypt.hash('ownerpassword123', 10);
      const mwcHash = await bcrypt.hash('mwcpassword123', 10);

      await execute(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
        ['Audrey Hepburn', 'user@manis.com', userHash, 'user', 'active']
      );
      await execute(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
        ['Mani Kote', 'owner@manis.com', ownerHash, 'owner', 'active']
      );
      await execute(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
        ['MWC Developer', 'mwc@manis.com', mwcHash, 'mwc', 'active']
      );
      console.log('Users seeded.');
    } else {
      console.log('Users already exist, skipping.');
    }

    // 3. Seed Luxury Products
    const existingProducts = await query('SELECT id FROM products LIMIT 1');
    if (existingProducts.length === 0) {
      console.log('Seeding initial luxury chocolates...');

      const productsData = [
        {
          name: 'Dark Cocoa Eclipse',
          slug: 'dark-cocoa-eclipse',
          description: 'A stellar dark chocolate crafted from 80% single-origin Venezuelan Criollo cocoa. Features deep, mysterious notes of black cherry, roasted espresso, and a finish accented with delicate, edible 24k gold foil.',
          price: 24.50,
          stock: 120,
          category: 'Dark Chocolate',
          dietary_tags: JSON.stringify(['vegan', 'gluten-free', 'organic']),
          flavor_profile: JSON.stringify({ cocoa: 80, sweetness: 1, notes: ['espresso', 'black cherry', 'smoke'] }),
          video_url: '', // Left blank to demonstrate fallback or uploaded in Admin
          fallback_ingredients: JSON.stringify(['Organic Cocoa Mass', 'Organic Cocoa Butter', 'Demerara Sugar', 'Edible 24k Gold Foil']),
          images: JSON.stringify(['/assets/products/eclipse-1.jpg']),
          is_spotlight: 1
        },
        {
          name: 'Golden Truffle Symphony',
          slug: 'golden-truffle-symphony',
          description: 'Our signature creamy milk chocolate truffle bar infused with wild honeycomb crunch, Fleur de Sel sea salt flakes, and layered with liquid gold-caramel filling.',
          price: 28.00,
          stock: 85,
          category: 'Milk Chocolate',
          dietary_tags: JSON.stringify(['gluten-free']),
          flavor_profile: JSON.stringify({ cocoa: 45, sweetness: 4, notes: ['salted caramel', 'honeycomb', 'vanilla'] }),
          video_url: '',
          fallback_ingredients: JSON.stringify(['Cocoa Butter', 'Whole Milk Powder', 'Sugar', 'Caramelized Honey', 'Fleur de Sel', 'Lecithin']),
          images: JSON.stringify(['/assets/products/symphony-1.jpg']),
          is_spotlight: 0
        },
        {
          name: 'Mani\'s Raspberry Royale',
          slug: 'manis-raspberry-royale',
          description: 'A stunning white chocolate masterpiece dyed with natural freeze-dried raspberry powder for a rich maroon hue. Dotted with chopped pistachios and crystalized violet petals.',
          price: 26.00,
          stock: 95,
          category: 'White Chocolate',
          dietary_tags: JSON.stringify(['gluten-free', 'contains-nuts']),
          flavor_profile: JSON.stringify({ cocoa: 32, sweetness: 5, notes: ['raspberry tartness', 'pistachio', 'rose'] }),
          video_url: '',
          fallback_ingredients: JSON.stringify(['Cocoa Butter', 'Cane Sugar', 'Dry Milk Solids', 'Freeze-dried Raspberries', 'Sicilian Pistachios']),
          images: JSON.stringify(['/assets/products/raspberry-1.jpg']),
          is_spotlight: 0
        },
        {
          name: 'Vegas Bourbon Hazelnut',
          slug: 'vegas-bourbon-hazelnut',
          description: 'A bold, sophisticated blend of 70% dark chocolate barrel-aged in premium Kentucky bourbon casks, loaded with caramelized Italian hazelnuts and smoked oakwood aroma.',
          price: 29.50,
          stock: 60,
          category: 'Dark Chocolate',
          dietary_tags: JSON.stringify(['vegan', 'contains-nuts']),
          flavor_profile: JSON.stringify({ cocoa: 70, sweetness: 2, notes: ['bourbon whiskey', 'roasted hazelnut', 'charred oak'] }),
          video_url: '',
          fallback_ingredients: JSON.stringify(['Cask-Aged Cocoa Mass', 'Cane Sugar', 'Caramelized Hazelnuts', 'Natural Bourbon Extract']),
          images: JSON.stringify(['/assets/products/bourbon-1.jpg']),
          is_spotlight: 0
        },
        {
          name: 'Lavender Silk Noir',
          slug: 'lavender-silk-noir',
          description: 'A botanically-infused 65% dark chocolate featuring French culinary lavender extract, high-mountain black tea leaves, and a silky smooth texture that melts on the palate.',
          price: 25.00,
          stock: 110,
          category: 'Botanical Chocolate',
          dietary_tags: JSON.stringify(['vegan', 'gluten-free']),
          flavor_profile: JSON.stringify({ cocoa: 65, sweetness: 2, notes: ['french lavender', 'bergamot', 'tannins'] }),
          video_url: '',
          fallback_ingredients: JSON.stringify(['Cocoa Butter', 'Cocoa Mass', 'Sugar', 'Organic Lavender Buds', 'Earl Grey Tea Leaf Dust']),
          images: JSON.stringify(['/assets/products/lavender-1.jpg']),
          is_spotlight: 0
        },
        {
          name: 'Customize Your Happiness Box',
          slug: 'custom-happiness-box',
          description: 'Design your own premium custom chocolate box box with selection of our finest handmade truffles, creams, and pralines. Available in 9-slot, 16-slot, and 24-slot velvet cases.',
          price: 49.00,
          stock: 999, // Infinite virtual stock
          category: 'Custom Creation',
          dietary_tags: JSON.stringify([]),
          flavor_profile: JSON.stringify({ cocoa: 50, sweetness: 3, notes: ['customizable'] }),
          video_url: '',
          fallback_ingredients: JSON.stringify(['Assorted cocoa butter', 'Cane sugar', 'Milk solids', 'Natural vanilla beans']),
          images: JSON.stringify(['/assets/products/custom-box.jpg']),
          is_spotlight: 0
        }
      ];

      for (const p of productsData) {
        await execute(
          `INSERT INTO products (name, slug, description, price, stock, category, dietary_tags, flavor_profile, video_url, fallback_ingredients, images, is_spotlight) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.name, p.slug, p.description, p.price, p.stock, p.category, p.dietary_tags, p.flavor_profile, p.video_url, p.fallback_ingredients, p.images, p.is_spotlight]
        );
      }
      console.log('Luxury chocolates seeded.');
    } else {
      console.log('Chocolates already exist, skipping.');
    }

    // 4. Seed Settings
    const existingSettings = await query('SELECT key FROM settings LIMIT 1');
    if (existingSettings.length === 0) {
      console.log('Seeding business and site settings...');
      const settingsData = [
        { key: 'business_name', value: 'Mani\'s Kote Factory' },
        { key: 'tagline', value: 'Customize Your Happiness' },
        { key: 'contact_email', value: 'concierge@maniskotefactory.com' },
        { key: 'contact_phone', value: '+1 (800) COCOA-LUXE' },
        { key: 'contact_address', value: '700 Cocoa Boulevard, Suite 100, Chocolate District, Hershey PA 17033' },
        { key: 'delivery_zones', value: JSON.stringify(['North America', 'European Union', 'United Kingdom', 'Switzerland', 'Japan', 'Singapore']) },
        { key: 'alert_sound', value: 'cocoa-bell' }, // default sound selection
        { key: 'announcement_banner', value: 'Welcome to the New Era of Taste. Free Express Shipping on Custom Boxes above $100.' }
      ];

      for (const s of settingsData) {
        await execute('INSERT INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
      }
      console.log('Settings seeded.');
    } else {
      console.log('Settings already exist, skipping.');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seed();
