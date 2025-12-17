import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const generateId = async () => {
    let unique = false;
    let id = '';
    while (!unique) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        id = '';
        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if ID exists in DB
        const existing = await User.findOne({ customId: id });
        if (!existing) {
            unique = true;
        }
    }
    return id;
};

const migrateUsers = async () => {
    await connectDB();

    try {
        const users = await User.find({ customId: { $exists: false } });
        console.log(`Found ${users.length} users without customId`);

        for (const user of users) {
            const newId = await generateId();
            user.customId = newId;
            await user.save();
            console.log(`Updated user ${user.email} with ID: ${newId}`);
        }

        console.log('Migration completed successfully');
        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateUsers();
