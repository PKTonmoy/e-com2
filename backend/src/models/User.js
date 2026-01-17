import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: false }, // Optional for OAuth users
    phone: { type: String }, // User's mobile number
    address: { type: String }, // User's address
    city: { type: String },
    country: { type: String },
    postalCode: { type: String },
    role: { type: String, enum: ['customer', 'staff', 'manager', 'admin'], default: 'customer' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    addresses: [addressSchema],
    profileComplete: { type: Boolean, default: false }, // Track if Google user completed profile

    // Google OAuth fields
    googleId: { type: String, unique: true, sparse: true }, // Google's unique user ID
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    avatarUrl: { type: String }, // Profile picture URL from Google
    lastLogin: { type: Date }, // Track last login time

    // Custom Human-Readable ID
    customId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// Generate customId before saving
userSchema.pre('save', async function (next) {
  if (this.isNew && !this.customId) {
    // Generate an 8-character uppercase alphanumeric ID
    // e.g., A7B2X9Y1
    let unique = false;
    while (!unique) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let id = '';
      for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await mongoose.models.User.findOne({ customId: id });
      if (!existing) {
        this.customId = id;
        unique = true;
      }
    }
  }
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  if (!this.passwordHash) return false; // OAuth users have no password
  return bcrypt.compare(entered, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================
userSchema.index({ role: 1 });                  // Filter users by role (admin panel)
userSchema.index({ createdAt: -1 });            // Sort by registration date
userSchema.index({ provider: 1 });              // Filter OAuth vs local users
userSchema.index({ lastLogin: -1 });            // Find recently active users

const User = mongoose.model('User', userSchema);
export default User;
