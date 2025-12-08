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

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;

