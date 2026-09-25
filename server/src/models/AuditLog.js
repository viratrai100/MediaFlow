import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    resource: {
      type: String,
      default: 'system'
    },
    ipAddress: {
      type: String,
      default: 'unknown'
    },
    userAgent: {
      type: String,
      default: 'unknown'
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
      index: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Auto-purge audit logs after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
