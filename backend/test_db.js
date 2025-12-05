import mongoose from 'mongoose';

const test = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/prelux', { serverSelectionTimeoutMS: 5000 });
        console.log('Connected successfully!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
};

test();
