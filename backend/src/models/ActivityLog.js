import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    entity: String,
    meta: Object,
  },
  { timestamps: true }
);

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================
activityLogSchema.index({ actorId: 1 });         // Filter by user
activityLogSchema.index({ action: 1 });          // Filter by action type
activityLogSchema.index({ entity: 1 });          // Filter by entity type
activityLogSchema.index({ createdAt: -1 });      // Sort by date

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;

