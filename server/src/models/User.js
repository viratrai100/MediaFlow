import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      index: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Excluded by default from query results
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    quota: {
      dailyLimit: {
        type: Number,
        default: 50 // Registered users get 50 downloads/day
      },
      downloadsToday: {
        type: Number,
        default: 0
      },
      lastResetDate: {
        type: Date,
        default: Date.now
      }
    },
    preferences: {
      defaultQuality: {
        type: String,
        default: '1080p'
      },
      preferredAudioExt: {
        type: String,
        default: 'MP3'
      },
      emailNotifications: {
        type: Boolean,
        default: false
      }
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password against hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
UserSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Safe JSON serialization: remove sensitive fields
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject ? this.toObject() : { ...this };
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
