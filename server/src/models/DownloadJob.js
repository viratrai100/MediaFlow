import mongoose from 'mongoose';

const DownloadJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null for anonymous guests
      index: true
    },
    clientIpHash: {
      type: String,
      index: true
    },
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
    mediaTitle: {
      type: String,
      default: 'Unknown Media'
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
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    fileSizeMB: {
      type: Number,
      default: 0
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    tempFilePath: {
      type: String,
      default: null
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

// TTL index to automatically purge completed/failed download job records after 14 days
DownloadJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });

export const DownloadJob = mongoose.models.DownloadJob || mongoose.model('DownloadJob', DownloadJobSchema);
