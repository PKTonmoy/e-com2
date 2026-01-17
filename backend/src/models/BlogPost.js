import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    contentHTML: { type: String, required: true },
    excerpt: String,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [String],
    publishedAt: { type: Date, default: Date.now },
    coverImage: String,
    category: String,
  },
  { timestamps: true }
);

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================
blogPostSchema.index({ publishedAt: -1 });       // Sort by publish date
blogPostSchema.index({ category: 1 });           // Filter by category
blogPostSchema.index({ tags: 1 });               // Filter by tags
blogPostSchema.index({ authorId: 1 });           // Filter by author

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;

