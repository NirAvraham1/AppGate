import mongoose from 'mongoose';
const { Schema } = mongoose;

// Project: app = project. Full multi-tenant separation.
const ProjectSchema = new Schema({
  name: { type: String, required: true },
  apiKeyHash: { type: String, required: true, index: true },
  apiKeyPrefix: String, // first chars shown in portal, e.g. "ag_live_x7K2"
  storeUrl: String,
  ownerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

// Directive: the single "hot" document, read on every app open.
const DirectiveSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', unique: true, index: true },
  updatedAt: { type: Date, default: Date.now },
  maintenance: {
    active: { type: Boolean, default: false },     // manual switch ("emergency button")
    from: Date,                                    // scheduled window start (UTC)
    to: Date,                                      // scheduled window end (UTC)
    title: { type: String, default: 'שיפורים בדרך' },
    message: { type: String, default: 'אנחנו משדרגים את המערכת' },
    returnAt: String,                              // free-text "back at 03:00"
    minVersion: Number,                            // optional version targeting
    maxVersion: Number,                            // e.g. maintenance only below 2.0
  },
  versionPolicy: {
    min: { type: Number, default: 0 },             // below this -> FORCE_UPDATE
    soft: { type: Number, default: 0 },            // below this -> SOFT_UPDATE banner
    url: String,                                   // store page
  },
  // features: { payments: { enabled: true, msg: '...' }, chat: {...} }
  features: { type: Map, of: new Schema({ enabled: Boolean, msg: String }, { _id: false }), default: {} },
});

// AuditLog: append-only. Written once, never modified.
const AuditLogSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, index: true },
  userId: { type: Schema.Types.ObjectId },
  userEmail: String,
  action: String,      // e.g. MAINTENANCE_ON, FEATURE_TOGGLED
  details: Object,
  timestamp: { type: Date, default: Date.now },
});
AuditLogSchema.index({ projectId: 1, timestamp: -1 });

// TelemetryEvent: append-only raw events. TTL 30 days. Portal never reads this directly.
const TelemetryEventSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, index: true },
  deviceHash: String,
  eventType: String,   // STATUS_CHECK, MAINTENANCE_SHOWN, UPDATE_SHOWN, FEATURE_BLOCKED
  versionCode: Number,
  timestamp: { type: Date, default: Date.now },
});
TelemetryEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // TTL 30d
TelemetryEventSchema.index({ projectId: 1, timestamp: -1 });

// HourlyStats: aggregate the portal actually reads. Small & fast queries.
const HourlyStatsSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, index: true },
  hourBucket: Date,    // truncated to the hour
  eventType: String,
  versionCode: Number,
  count: { type: Number, default: 0 },
});
HourlyStatsSchema.index({ projectId: 1, hourBucket: 1, eventType: 1, versionCode: 1 }, { unique: true });

// CrashReport: distilled crash summary from the SDK's crash sniffer.
// Append-only, TTL 30 days. One small readable record per crash.
const CrashReportSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, index: true },
  deviceHash: String,
  exception: String,    // e.g. NullPointerException
  message: String,      // the short reason
  location: String,     // Class.method:line inside the app
  thread: String,
  versionCode: Number,
  sdkInt: Number,
  device: String,
  timestamp: { type: Date, default: Date.now },
});
CrashReportSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
CrashReportSchema.index({ projectId: 1, timestamp: -1 });

const UserSchema = new Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  name: String,
});

export const Project = mongoose.model('Project', ProjectSchema);
export const Directive = mongoose.model('Directive', DirectiveSchema);
export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export const TelemetryEvent = mongoose.model('TelemetryEvent', TelemetryEventSchema);
export const HourlyStats = mongoose.model('HourlyStats', HourlyStatsSchema);
export const CrashReport = mongoose.model('CrashReport', CrashReportSchema);
export const User = mongoose.model('User', UserSchema);
