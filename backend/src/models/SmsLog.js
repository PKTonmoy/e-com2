import mongoose from 'mongoose';

const smsLogSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
        phone: { type: String, required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ['success', 'failed'], required: true },
        apiResponse: { type: mongoose.Schema.Types.Mixed },
        error: String,
    },
    { timestamps: true }
);

// Index for querying by order
smsLogSchema.index({ orderId: 1 });
// Index for querying logs by date (useful for auditing)
smsLogSchema.index({ createdAt: -1 });

const SmsLog = mongoose.model('SmsLog', smsLogSchema);
export default SmsLog;
