import mongoose from 'mongoose';

const AppSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: 'GLOBAL_SETTINGS',
      unique: true
    },
    isMaintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'System is undergoing scheduled maintenance.'
    },
    allowRegistration: {
      type: Boolean,
      default: true
    },
    anonymousDailyQuota: {
      type: Number,
      default: 15
    },
    registeredDailyQuota: {
      type: Number,
      default: 50
    },
    maxConcurrentDownloadsPerUser: {
      type: Number,
      default: 2
    },
    maxDownloadFileSizeMB: {
      type: Number,
      default: 500
    },
    tempFileTtlMinutes: {
      type: Number,
      default: 60
    },
    globalRateLimitPerMinute: {
      type: Number,
      default: 60
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

// Static helper to get or initialize singleton settings
AppSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
  if (!settings) {
    settings = await this.create({ singletonKey: 'GLOBAL_SETTINGS' });
  }
  return settings;
};

export const AppSettings = mongoose.models.AppSettings || mongoose.model('AppSettings', AppSettingsSchema);
