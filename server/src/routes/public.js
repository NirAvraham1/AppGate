import { Router } from 'express';
import { apiKeyAuth } from '../middleware/auth.js';
import { getDirective } from '../services/cache.js';
import { resolveDirective } from '../services/resolver.js';
import { TelemetryEvent, CrashReport } from '../models/index.js';

const router = Router();

// GET /v1/directive - the heart of the system.
// Receives version + platform, returns the directive. Supports ETag/304.
router.get('/directive', apiKeyAuth, async (req, res) => {
  const versionCode = parseInt(req.query.versionCode || '0', 10);
  const directive = await getDirective(req.projectId);          // memory, not DB
  const resolved = resolveDirective(directive, { versionCode }); // full compute only when needed

  // The directive rarely changes. Instead of the same JSON again and
  // again - an empty 304. Saves traffic and battery; the implementation
  // is a single string comparison.
  if (req.header('If-None-Match') === resolved.etag) {
    return res.status(304).end();
  }
  res.set('ETag', resolved.etag);
  res.json(resolved);
});

// POST /v1/events - one telemetry event per status check.
router.post('/events', apiKeyAuth, async (req, res) => {
  const { deviceHash, eventType, versionCode, timestamp } = req.body || {};
  if (!eventType) return res.status(400).json({ error: 'eventType required' });
  await TelemetryEvent.create({
    projectId: req.projectId,
    deviceHash: String(deviceHash || 'unknown').slice(0, 64),
    eventType: String(eventType).slice(0, 40),
    versionCode: parseInt(versionCode || '0', 10),
    timestamp: timestamp ? new Date(timestamp) : new Date(),
  });
  res.status(202).json({ ok: true });
});

// POST /v1/crashes - a small, readable crash summary from the SDK's sniffer.
// Instead of a giant stack trace, we store one clear record per crash.
router.post('/crashes', apiKeyAuth, async (req, res) => {
  const b = req.body || {};
  await CrashReport.create({
    projectId: req.projectId,
    deviceHash: String(b.deviceHash || 'unknown').slice(0, 64),
    exception: String(b.exception || 'Unknown').slice(0, 120),
    message: String(b.message || '').slice(0, 500),
    location: String(b.location || '').slice(0, 200),
    thread: String(b.thread || '').slice(0, 60),
    versionCode: parseInt(b.versionCode || '0', 10),
    sdkInt: parseInt(b.sdkInt || '0', 10),
    device: String(b.device || '').slice(0, 80),
    timestamp: b.timestamp ? new Date(b.timestamp) : new Date(),
  });
  res.status(202).json({ ok: true });
});

export default router;
