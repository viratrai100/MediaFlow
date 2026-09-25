import mongoose from 'mongoose';

const DownloadLogSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    formatId: {
      type: String,
      required: true
    },
    container: {
      type: String,
      default: 'mp4'
    },
    mediaType: {
      type: String,
      enum: ['video', 'audio'],
      default: 'video'
    },
    fileSizeMB: {
      type: Number,
      default: 0
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'streaming', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    clientIpHash: {
      type: String,
      index: true
    },
    processingTimeMs: {
      type: Number,
      default: 0
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge download logs after 30 days
DownloadLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const DownloadLog = mongoose.models.DownloadLog || mongoose.model('DownloadLog', DownloadLogSchema);
