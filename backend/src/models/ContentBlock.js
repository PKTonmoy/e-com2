import mongoose from 'mongoose';

const contentBlockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    html: String,
    meta: Object,
  },
  { timestamps: true }
);

const ContentBlock = mongoose.model('ContentBlock', contentBlockSchema);
export default ContentBlock;

