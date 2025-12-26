
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ReturnRequest from './src/models/ReturnRequest.js';
import Order from './src/models/Order.js';

dotenv.config();

const checkReturns = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const returns = await ReturnRequest.find().sort({ createdAt: -1 }).limit(5);

        console.log('--- Latest Return Requests ---');
        returns.forEach(r => {
            console.log(`ID: ${r._id}`);
            console.log(`Order Number: ${r.orderNumber}`);
            console.log(`Status: ${r.status}`);
            console.log('Steadfast Data:', JSON.stringify(r.steadfastData, null, 2));
            console.log('---------------------------');
        });

        if (returns.length > 0) {
            const latest = returns[0];
            const order = await Order.findById(latest.orderId);
            console.log('--- Order Debug Info ---');
            console.log('Order ID:', order._id);
            console.log('Invoice Used:', String(order._id));
            if (order.courier) {
                console.log('Courier:', order.courier);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkReturns();
