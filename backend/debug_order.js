
import dotenv from 'dotenv';
import { createSteadfastOrder } from './src/services/steadfastClient.js';

dotenv.config();

const testOrder = async () => {
    const mockPayload = {
        invoice: `TEST-DUPLICATE-CHECK-1`, // Fixed ID to test duplication
        recipient_name: 'Test Recipient',
        recipient_phone: '01711111111',
        recipient_address: 'Test Address, Dhaka',
        cod_amount: 100,
        note: 'Debug test order',
        item_description: '1 item(s)',
        delivery_type: 0 // Home delivery
    };

    console.log('Sending mock mockPayload:', mockPayload);

    try {
        const result = await createSteadfastOrder(mockPayload);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error creating order:');
        console.error('Message:', error.message);
        console.error('Status:', error.statusCode);
        console.error('Response Data:', JSON.stringify(error.courierResponse, null, 2));
    }
};

testOrder();
