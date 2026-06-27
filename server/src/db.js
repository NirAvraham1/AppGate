import mongoose from 'mongoose';

export async function connectDB() {
  let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/appgate';
  if (process.env.MEMORY_DB === 'true') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri('appgate');
    console.log('[db] running with in-memory MongoDB (demo mode)');
  }
  await mongoose.connect(uri);
  console.log('[db] connected');
}
