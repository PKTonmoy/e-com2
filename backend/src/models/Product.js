import mongoose from 'mongoose';

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================
// These indexes dramatically improve query speed as your product count grows
// Note: Indexes are applied to the schema after it's defined below

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
    title: { type: String, required: true, index: true },  // Indexed
    slug: { type: String, required: true, unique: true },  // Auto-indexed (unique)
    sku: { type: String, required: true, unique: true },   // Auto-indexed (unique)
    price: { type: Number, required: true, index: true },  // Indexed
    salePrice: { type: Number, index: true },              // Indexed
    currency: { type: String, default: 'USD' },
    descriptionHTML: String,
    images: [String],
    category: { type: String, index: true },               // Indexed
    tags: [String],
    variants: [variantSchema],
    stock: { type: Number, default: 0 },
    trackInventory: { type: Boolean, default: true },
    limitedEdition: { type: Boolean, default: false, index: true }, // Indexed
    hasSizes: { type: Boolean, default: true },
    sizes: { type: [String], default: ['S', 'M', 'L', 'XL', 'XXL', '3XL'] },
    demo: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, index: true }, // Indexed
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// Compound indexes for common filter + sort combinations
productSchema.index({ category: 1, createdAt: -1 });  // Category page sorted by newest
productSchema.index({ limitedEdition: 1, createdAt: -1 }); // Limited edition sorted

// Text index for search functionality (title search)
productSchema.index({ title: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
