import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Null means broadcast/system-wide (filtered by other logic if needed)
    default: null
  },
  type: {
    type: String,
    enum: ['order', 'promo', 'system', 'message'],
    required: true,
    default: 'system'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  url: {
    type: String,
    default: null
  },
  image: {
    type: String, // URL to image
    default: null
  },
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  // For recurring/template notifications (if we want to use the same record as a template)
  isTemplate: {
    type: Boolean,
    default: false
  },
  targetSegments: [{ // Only relevant if userId is null and isTemplate/broadcast
    type: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
