import mongoose from 'mongoose';

export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${uri}`);
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
}
