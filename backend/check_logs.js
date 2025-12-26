import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ActivityLog from './src/models/ActivityLog.js';

dotenv.config();

const checkLogs = async () => {
    console.log('Starting log check...');
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is missing in process.env');
            process.exit(1);
        }
        console.log('Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB');

        const logs = await ActivityLog.find({
            action: { $in: ['steadfast_error', 'courier_approve_failed', 'steadfast_request', 'courier_approve_success'] }
        })
            .sort({ createdAt: -1 })
            .limit(20);

        console.log('Recent logs found:', logs.length);
        console.log('LOGS_START');
        console.log(JSON.stringify(logs, null, 2));
        console.log('LOGS_END');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Script Error:', err.message);
        process.exit(1);
    }
};

checkLogs();
