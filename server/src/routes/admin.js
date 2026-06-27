import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { jwtAuth, signToken, hashApiKey } from '../middleware/auth.js';
import { Project, Directive, AuditLog, HourlyStats, TelemetryEvent, CrashReport, User } from '../models/index.js';
import { invalidate, getDirective } from '../services/cache.js';
import { resolveDirective, maintenanceIsLive } from '../services/resolver.js';
import { audit } from '../services/audit.js';

const router = Router();

// ---- auth ----
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
  }
  res.json({ token: signToken(user), user: { email: user.email, name: user.name } });
});

// everything below requires a logged-in portal user
router.use(jwtAuth);

// ---- projects ----
router.get('/projects', async (req, res) => {
  const projects = await Project.find().lean();
  res.json(projects.map(p => ({ id: p._id, name: p.name, apiKeyPrefix: p.apiKeyPrefix, createdAt: p.createdAt })));
});

router.post('/projects', async (req, res) => {
  const { name, storeUrl } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const apiKey = 'ag_live_' + crypto.randomBytes(18).toString('base64url');
  const project = await Project.create({
    name, storeUrl,
    apiKeyHash: hashApiKey(apiKey),
    apiKeyPrefix: apiKey.slice(0, 12) + '…',
    ownerUserId: req.user.id,
  });
  await Directive.create({ projectId: project._id, versionPolicy: { url: storeUrl } });
  req.projectId = project._id;
  await audit(req, 'PROJECT_CREATED', { name });
  // API key is returned ONCE - only the hash is stored.
  res.status(201).json({ id: project._id, name, apiKey });
});

// project-scoped middleware
router.use('/projects/:projectId', (req, res, next) => { req.projectId = req.params.projectId; next(); });

// current full state for the portal (incl. live status)
router.get('/projects/:projectId/state', async (req, res) => {
  const directive = await Directive.findOne({ projectId: req.projectId }).lean();
  if (!directive) return res.status(404).json({ error: 'not found' });
  const resolved = resolveDirective(directive, { versionCode: 999999 });
  res.json({ directive, liveStatus: resolved.status, maintenanceLive: maintenanceIsLive(directive.maintenance) });
});

// ---- maintenance: activate / schedule ----
// Updates DB, in-memory cache and a new ETag.
router.post('/projects/:projectId/maintenance', async (req, res) => {
  const { active, from, to, title, message, returnAt, minVersion, maxVersion } = req.body || {};
  const update = {};
  if (active !== undefined) update['maintenance.active'] = !!active;
  if (from !== undefined) update['maintenance.from'] = from ? new Date(from) : null;
  if (to !== undefined) update['maintenance.to'] = to ? new Date(to) : null;
  if (title !== undefined) update['maintenance.title'] = title;
  if (message !== undefined) update['maintenance.message'] = message;
  if (returnAt !== undefined) update['maintenance.returnAt'] = returnAt;
  if (minVersion !== undefined) update['maintenance.minVersion'] = minVersion || null;
  if (maxVersion !== undefined) update['maintenance.maxVersion'] = maxVersion || null;
  update.updatedAt = new Date();

  const directive = await Directive.findOneAndUpdate({ projectId: req.projectId }, { $set: update }, { new: true });
  invalidate(req.projectId);
  await audit(req, active === true ? 'MAINTENANCE_ON' : active === false ? 'MAINTENANCE_OFF' : 'MAINTENANCE_SCHEDULED', req.body);
  res.json(directive);
});

// ---- version policy ----
router.put('/projects/:projectId/version-policy', async (req, res) => {
  const { min, soft, url } = req.body || {};
  const directive = await Directive.findOneAndUpdate(
    { projectId: req.projectId },
    { $set: { 'versionPolicy.min': min || 0, 'versionPolicy.soft': soft || 0, 'versionPolicy.url': url || null, updatedAt: new Date() } },
    { new: true },
  );
  invalidate(req.projectId);
  await audit(req, 'VERSION_POLICY_UPDATED', { min, soft, url });
  res.json(directive);
});

// ---- feature flags ----
router.put('/projects/:projectId/features/:key', async (req, res) => {
  const { enabled, msg } = req.body || {};
  const key = req.params.key.replace(/[^a-zA-Z0-9_-]/g, '');
  const directive = await Directive.findOneAndUpdate(
    { projectId: req.projectId },
    { $set: { [`features.${key}`]: { enabled: !!enabled, msg: msg || '' }, updatedAt: new Date() } },
    { new: true },
  );
  invalidate(req.projectId);
  await audit(req, 'FEATURE_TOGGLED', { key, enabled, msg });
  res.json(directive);
});

router.delete('/projects/:projectId/features/:key', async (req, res) => {
  const key = req.params.key.replace(/[^a-zA-Z0-9_-]/g, '');
  const directive = await Directive.findOneAndUpdate(
    { projectId: req.projectId },
    { $unset: { [`features.${key}`]: 1 }, $set: { updatedAt: new Date() } },
    { new: true },
  );
  invalidate(req.projectId);
  await audit(req, 'FEATURE_DELETED', { key });
  res.json(directive);
});

// ---- analytics: aggregated data, from the summary table only ----
router.get('/projects/:projectId/analytics', async (req, res) => {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const stats = await HourlyStats.find({ projectId: req.projectId, hourBucket: { $gte: since } }).lean();

  const versionDist = {}; const eventCounts = {};
  for (const s of stats) {
    if (s.eventType === 'STATUS_CHECK') versionDist[s.versionCode] = (versionDist[s.versionCode] || 0) + s.count;
    eventCounts[s.eventType] = (eventCounts[s.eventType] || 0) + s.count;
  }
  // unique device counter - the one query allowed on raw (indexed, 24h window)
  const devices24h = (await TelemetryEvent.distinct('deviceHash', { projectId: req.projectId, timestamp: { $gte: since } })).length;

  res.json({ devices24h, versionDist, eventCounts, since });
});

// ---- audit log with pagination ----
router.get('/projects/:projectId/audit-log', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = 20;
  const [items, total] = await Promise.all([
    AuditLog.find({ projectId: req.projectId }).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments({ projectId: req.projectId }),
  ]);
  res.json({ items, page, totalPages: Math.ceil(total / limit) });
});

// ---- crashes: the distilled crash feed (newest first) ----
router.get('/projects/:projectId/crashes', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = 20;
  const [items, total] = await Promise.all([
    CrashReport.find({ projectId: req.projectId }).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    CrashReport.countDocuments({ projectId: req.projectId }),
  ]);
  res.json({ items, page, totalPages: Math.ceil(total / limit) });
});

export default router;
