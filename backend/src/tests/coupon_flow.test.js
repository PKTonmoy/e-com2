import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

describe('Coupon One-Time Use Logic', () => {
    let token;
    let userId;
    let couponCode = 'ONETIMETEST';
    let productId;

    beforeAll(async () => {
        // Wait for connection if mostly ensuring it's established
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        // Cleanup
        await User.deleteMany({ email: 'coupon_test@example.com' });
        await Coupon.deleteMany({ code: couponCode });
        await Product.deleteMany({ name: 'Coupon Test Product' });
        await Order.deleteMany({}); // Be careful here, but usually tests run on separate DB

        // Create User
        const user = await User.create({
            name: 'Coupon Tester',
            email: 'coupon_test@example.com',
            password: 'password123',
        });
        userId = user._id;

        // Login to get token
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'coupon_test@example.com', password: 'password123' });
        token = res.body.token;

        // Create Product
        const product = await Product.create({
            name: 'Coupon Test Product',
            description: 'Test',
            price: 100,
            stock: 100,
            category: 'Test',
            images: ['test.jpg']
        });
        productId = product._id;

        // Create Coupon
        await Coupon.create({
            code: couponCode,
            type: 'fixed',
            value: 10,
            active: true
        });
    });

    afterAll(async () => {
        // Cleanup
        await User.deleteMany({ email: 'coupon_test@example.com' });
        await Coupon.deleteMany({ code: couponCode });
        await Product.deleteMany({ name: 'Coupon Test Product' });
        await Order.deleteMany({ userId });
        await mongoose.connection.close();
    });

    let orderId;

    test('1. Create order with coupon should succeed', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                items: [{ productId, qty: 1, price: 100 }],
                shipping: { address: '123 Test St', city: 'Test', postalCode: '12345', country: 'Test' },
                paymentMethod: 'Stripe',
                couponCode
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.couponCode).toBe(couponCode);
        orderId = res.body._id;

        const coupon = await Coupon.findOne({ code: couponCode });
        expect(coupon.usedBy.map(id => id.toString())).toContain(userId.toString());
    });

    test('2. Create second order with same coupon should fail', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                items: [{ productId, qty: 1, price: 100 }],
                shipping: { address: '123 Test St', city: 'Test', postalCode: '12345', country: 'Test' },
                paymentMethod: 'Stripe',
                couponCode
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/already used/i);
    });

    test('3. Cancel first order should restore coupon', async () => {
        const res = await request(app)
            .put(`/api/orders/${orderId}/cancel`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.orderStatus).toBe('cancelled');

        const coupon = await Coupon.findOne({ code: couponCode });
        expect(coupon.usedBy.map(id => id.toString())).not.toContain(userId.toString());
    });

    test('4. Create order again with same coupon should succeed', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                items: [{ productId, qty: 1, price: 100 }],
                shipping: { address: '123 Test St', city: 'Test', postalCode: '12345', country: 'Test' },
                paymentMethod: 'Stripe',
                couponCode
            });

        expect(res.statusCode).toBe(201);

        const coupon = await Coupon.findOne({ code: couponCode });
        expect(coupon.usedBy.map(id => id.toString())).toContain(userId.toString());
    });
});
