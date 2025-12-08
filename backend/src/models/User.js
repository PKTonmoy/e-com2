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
    role: { type: String, enum: ['customer', 'staff', 'manager', 'admin'], default: 'customer' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    addresses: [addressSchema],

    // Google OAuth fields
    googleId: { type: String, unique: true, sparse: true }, // Google's unique user ID
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    avatarUrl: { type: String }, // Profile picture URL from Google
    lastLogin: { type: Date }, // Track last login time
  },
  { timestamps: true }
);

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

const User = mongoose.model('User', userSchema);
export default User;
