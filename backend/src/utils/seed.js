import fs from 'fs';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import BlogPost from '../models/BlogPost.js';
import Coupon from '../models/Coupon.js';

dotenv.config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, '../../../seed.json');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const raw = fs.readFileSync(seedPath, 'utf-8');
  let products = JSON.parse(raw);
  products = products.map(p => {
    const { _id, ...rest } = p;
    return rest;
  });

  await Promise.all([
    Product.deleteMany({}),
    User.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
    BlogPost.deleteMany({}),
    Coupon.deleteMany({}),
  ]);

  const createdProducts = await Product.insertMany(products);

  const admin = await User.create({
    name: 'PRELUX Admin',
    email: 'admin@prelux.lux',
    passwordHash: 'admin123',
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Aurelia Client',
    email: 'client@prelux.lux',
    passwordHash: 'client123',
    role: 'customer',
  });

  // Create sample coupons
  await Coupon.create([
    { code: 'PRELUX10', type: 'percentage', value: 10, active: true },
    { code: 'WELCOME20', type: 'percentage', value: 20, active: true, expiresAt: new Date('2025-12-31') },
    { code: 'FLAT50', type: 'fixed', value: 50, active: true, minPurchase: 200 },
    { code: 'VIP25', type: 'percentage', value: 25, active: true, minPurchase: 500, expiresAt: new Date('2025-06-30') },
    { code: 'EXPIRED10', type: 'percentage', value: 10, active: true, expiresAt: new Date('2024-01-01') },
  ]);

  await BlogPost.create({
    title: 'The PRELUX Chronicle',
    slug: 'prelux-chronicle',
    contentHTML:
      '<p>Discover the making of our limited collections and the ateliers crafting for PRELUX.</p>',
    excerpt: 'Behind the scenes of PRELUX craft.',
    authorId: admin._id,
    tags: ['craft', 'heritage'],
  });

  await Order.create({
    userId: customer._id,
    items: [
      {
        productId: createdProducts[0]._id,
        variantId: createdProducts[0].variants?.[0]?.id,
        qty: 1,
        price: createdProducts[0].price,
        title: createdProducts[0].title,
        sku: createdProducts[0].sku,
      },
    ],
    shipping: {
      name: customer.name,
      address: '10 Avenue Montaigne',
      city: 'Paris',
      country: 'France',
      postalCode: '75008',
    },
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    total: createdProducts[0].price,
  });

  console.log('Seeded PRELUX data with products:', createdProducts.length);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

