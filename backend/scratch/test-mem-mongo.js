import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

async function run() {
  console.log('Starting MongoMemoryServer...');
  try {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`✓ Started! Connection URI: ${uri}`);
    
    console.log('Connecting mongoose...');
    await mongoose.connect(uri);
    console.log('✓ Connected successfully!');
    
    await mongoose.disconnect();
    await mongod.stop();
    console.log('✓ Cleaned up successfully!');
  } catch (err) {
    console.error('✗ Failed to run in-memory Mongo:', err);
  }
}

run();
