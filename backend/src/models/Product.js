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
    demo: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;

