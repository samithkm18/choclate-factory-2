import mongoose from 'mongoose';

const ports = [
  64312, 63778, 63776, 60433, 60432, 60431, 60430, 59350, 51249, 50214, 50201, 50200, 49809
];

async function run() {
  for (const port of ports) {
    const uri = `mongodb://127.0.0.1:${port}/manischocolate?directConnection=true`;
    console.log(`Testing port ${port}...`);
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
      console.log(`✓ SUCCESS: Connected to MongoDB on port ${port}!`);
      await mongoose.disconnect();
      return;
    } catch (err) {
      // Ignored
    }
  }
  console.log('Finished scanning all ports.');
}

run();
