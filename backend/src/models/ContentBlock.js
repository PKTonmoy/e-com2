import mongoose from 'mongoose';

const contentBlockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    // Structured content fields
    content: {
      title: String,
      subtitle: String,
      description: String,
      image: String,
      badge: String,
      buttonText: String,
      buttonLink: String,
      button2Text: String,
      button2Link: String,
      items: [{ label: String, value: String }],
    },
    // Legacy HTML support
    html: String,
    meta: Object,
  },
  { timestamps: true }
);

const ContentBlock = mongoose.model('ContentBlock', contentBlockSchema);
export default ContentBlock;
