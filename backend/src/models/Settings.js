import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
    },
    { timestamps: true }
);

// Static method to get a setting
settingsSchema.statics.get = async function (key, defaultValue = null) {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
};

// Static method to set a setting
settingsSchema.statics.set = async function (key, value) {
    return this.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
    );
};

// Static method to get all notification settings
settingsSchema.statics.getNotificationSettings = async function () {
    const defaults = {
        emailEnabled: true,
        telegramEnabled: true,
        whatsappEnabled: false,
        smsTemplate: `🎉 Order Confirmed!

Dear [Customer Name],
Your order (#[Order Number]) has been approved!

📦 Tracking ID: [Tracking ID]
[Tracking Link]

Thank you for shopping with us!`,
    };

    const saved = await this.findOne({ key: 'notifications' });
    return saved ? { ...defaults, ...saved.value } : defaults;
};

// Static method to update notification settings
settingsSchema.statics.setNotificationSettings = async function (settings) {
    return this.findOneAndUpdate(
        { key: 'notifications' },
        { key: 'notifications', value: settings },
        { upsert: true, new: true }
    );
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
