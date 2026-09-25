import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      index: true
    },
    ipAddress: {
      type: String,
      default: 'unknown'
    },
    userAgent: {
      type: String,
      default: 'unknown'
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Auto-delete expired sessions from MongoDB via TTL index
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
