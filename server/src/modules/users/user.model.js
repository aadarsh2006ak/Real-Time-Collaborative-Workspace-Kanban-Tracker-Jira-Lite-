// server/src/modules/users/user.model.js
const { Schema, model } = require('mongoose');

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    userAgent: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Invalid email format'],
    },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, default: '' },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
  },
  { timestamps: true }
);

// Indexes are automatically defined by unique: true on email

module.exports = model('User', userSchema);
