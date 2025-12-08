import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config();

// Define Product schema inline for seeding
const variantSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: Number,
    stock: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    salePrice: Number,
    currency: { type: String, default: 'USD' },
    descriptionHTML: String,
    images: [String],
    category: String,
    tags: [String],
    variants: [variantSchema],
    stock: { type: Number, default: 0 },
    trackInventory: { type: Boolean, default: true },
    limitedEdition: { type: Boolean, default: false },
    sizes: { type: [String], default: ['S', 'M', 'L', 'XL', 'XXL', '3XL'] },
    demo: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lowStockThreshold: { type: Number, default: 5 },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

async function seedDatabase() {
    console.log('Connecting to MongoDB Atlas...');
    console.log('URI exists:', !!process.env.MONGO_URI);

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Connected to MongoDB Atlas');

        // Read seed data
        const seedPath = path.join(__dirname, '../seed.json');
        const raw = fs.readFileSync(seedPath, 'utf-8');
        let products = JSON.parse(raw);

        // Remove _id fields to let MongoDB generate them
        products = products.map(p => {
            const { _id, ...rest } = p;
            return rest;
        });

        console.log(`Found ${products.length} products to seed`);

        // Clear existing products
        await Product.deleteMany({});
        console.log('✅ Cleared existing products');

        // Insert new products
        const inserted = await Product.insertMany(products);
        console.log(`✅ Seeded ${inserted.length} products successfully!`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

seedDatabase();
