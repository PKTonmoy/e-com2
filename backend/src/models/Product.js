import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    price: Number,
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
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
    hasSizes: { type: Boolean, default: true },
    sizes: { type: [String], default: ['S', 'M', 'L', 'XL', 'XXL', '3XL'] },
    demo: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================
// These indexes dramatically improve query speed as your product count grows

// Single field indexes for common queries
productSchema.index({ category: 1 });           // Category filtering
productSchema.index({ createdAt: -1 });         // Sorting by newest
productSchema.index({ limitedEdition: 1 });     // Limited edition filter
productSchema.index({ price: 1 });              // Price sorting/filtering
productSchema.index({ salePrice: 1 });          // Sale price queries

// Compound indexes for common filter + sort combinations
productSchema.index({ category: 1, createdAt: -1 });  // Category page sorted by newest
productSchema.index({ limitedEdition: 1, createdAt: -1 }); // Limited edition sorted

// Text index for search functionality (title search)
productSchema.index({ title: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;

