import dns from 'dns';
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  dns.setServers(['8.8.8.8', '8.8.4.4']);

  await mongoose.connect(mongoURI);
  console.log('MongoDB connected successfully');
};

export default connectDB;
