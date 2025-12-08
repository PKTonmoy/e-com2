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

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;

