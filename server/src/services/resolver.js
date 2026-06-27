import { computeEtag } from './etag.js';

// scheduleChecker: compares current time to the scheduled window - no cron job needed.
export function maintenanceIsLive(m, now = new Date()) {
  if (!m) return false;
  if (m.active) return true; // manual emergency switch
  if (m.from && m.to) return now >= new Date(m.from) && now <= new Date(m.to);
  return false;
}

function versionInRange(versionCode, min, max) {
  if (min != null && versionCode < min) return false;
  if (max != null && versionCode > max) return false;
  return true;
}

// directiveResolver: merges maintenance + version policy + features
// into ONE directive, according to the versionCode in the request.
// Priority: maintenance > force update > soft update > normal.
export function resolveDirective(directive, { versionCode = 0 } = {}) {
  const now = new Date();
  const m = directive?.maintenance || {};
  const vp = directive?.versionPolicy || {};
  const featuresMap = directive?.features || {};
  const features = {};
  const entries = featuresMap instanceof Map ? featuresMap.entries() : Object.entries(featuresMap);
  for (const [k, v] of entries) features[k] = { enabled: !!v.enabled, msg: v.msg || '' };

  let status = 'NORMAL';
  const live = maintenanceIsLive(m, now);
  const targeted = versionInRange(versionCode, m.minVersion, m.maxVersion);

  if (live && targeted) status = 'MAINTENANCE';
  else if (vp.min && versionCode < vp.min) status = 'FORCE_UPDATE';
  else if (vp.soft && versionCode < vp.soft) status = 'SOFT_UPDATE';

  const resolved = {
    status,
    maintenance: status === 'MAINTENANCE'
      ? { title: m.title, message: m.message, returnAt: m.returnAt || null, endsAt: m.to || null }
      : null,
    versionPolicy: { min: vp.min || 0, soft: vp.soft || 0, url: vp.url || null },
    features,
  };
  resolved.etag = computeEtag(resolved);
  return resolved;
}
