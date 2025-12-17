import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const verifyUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'name email customId');

        console.log('--- User Verification ---');
        let allValid = true;
        users.forEach(u => {
            console.log(`User: ${u.email.padEnd(30)} | ID: ${u.customId || 'MISSING'}`);
            if (!u.customId) allValid = false;
        });

        if (allValid) {
            console.log('\nSUCCESS: All users have a customId.');
        } else {
            console.log('\nFAILURE: Some users are missing customId.');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyUsers();
