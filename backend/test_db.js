import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const test = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        console.log('URI:', process.env.MONGO_URI ? 'Found' : 'Not found');

        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI not found in .env file');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected successfully to MongoDB Atlas!');
        console.log('Host:', mongoose.connection.host);
        console.log('Database:', mongoose.connection.name);
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
};

test();
