
import dotenv from 'dotenv';
import { createSteadfastReturnRequest } from './src/services/steadfastClient.js';

dotenv.config();

const debugReturn = async () => {
    // Using the tracking code from the previous successful (but suspicious) attempt
    const trackingCode = 'SFR251227STE708D87BD';
    // And its invoice
    const invoice = '694ef4997f0ab49439d4660a';

    console.log('--- Testing with Invoice ---');
    try {
        const payload1 = { invoice: invoice };
        console.log('Payload:', payload1);
        const res1 = await createSteadfastReturnRequest(payload1);
        console.log('Response:', JSON.stringify(res1, null, 2));
    } catch (e) {
        console.error('Error (Invoice):', e.message);
    }

    console.log('\n--- Testing with Tracking Code ---');
    try {
        const payload2 = { tracking_code: trackingCode };
        console.log('Payload:', payload2);
        const res2 = await createSteadfastReturnRequest(payload2);
        console.log('Response:', JSON.stringify(res2, null, 2));
    } catch (e) {
        console.error('Error (Tracking Code):', e.message);
    }
};

debugReturn();
