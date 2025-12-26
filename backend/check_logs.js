
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ActivityLog from './src/models/ActivityLog.js';

dotenv.config();

const checkLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const logs = await ActivityLog.find({ action: { $in: ['courier_create_failed', 'courier_approve_failed', 'steadfast_error'] } })
            .sort({ createdAt: -1 })
            .limit(5);

        console.log('--- Latest Failure Logs ---');
        logs.forEach(log => {
            console.log(`Action: ${log.action}`);
            console.log('Meta:', JSON.stringify(log.meta, null, 2));
            console.log('Timestamp:', log.createdAt);
            console.log('---------------------------');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

checkLogs();
