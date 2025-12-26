
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const instance = axios.create({
    baseURL: 'https://portal.packzy.com/api/v1',
    headers: {
        'Api-Key': process.env.STEADFAST_API_KEY,
        'Secret-Key': process.env.STEADFAST_SECRET_KEY,
        'Content-Type': 'application/json',
    },
});

const listReturns = async () => {
    try {
        console.log('Fetching return requests...');
        const res = await instance.get('/get_return_requests');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error('Error fetching returns:', error.message);
        if (error.response) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

listReturns();
