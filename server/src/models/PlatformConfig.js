import mongoose from 'mongoose';

const PlatformConfigSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    isEnabled: {
      type: Boolean,
      default: true,
      index: true
    },
    rateLimitPerMinute: {
      type: Number,
      default: 15
    },
    maxDurationSeconds: {
      type: Number,
      default: 1800 // 30 minutes
    },
    allowedFormats: [
      {
        formatId: String,
        container: String,
        quality: String,
        type: {
          type: String,
          enum: ['video', 'audio']
        }
      }
    ],
    lastHealthCheck: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const PlatformConfig = mongoose.models.PlatformConfig || mongoose.model('PlatformConfig', PlatformConfigSchema);
