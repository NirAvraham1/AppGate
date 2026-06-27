// Simulates a fleet of devices running the SDK against a local server.
// Great for demos: populates the devices counter, version distribution
// and event counts in the portal without needing an Android emulator.
//
// Usage: node scripts/simulate-devices.js [count=200] [baseUrl=http://localhost:4000]
import crypto from 'crypto';

const COUNT = parseInt(process.argv[2] || '200', 10);
const BASE = process.argv[3] || 'http://localhost:4000';
const API_KEY = process.env.API_KEY || 'ag_live_demo_key_12345';
const VERSIONS = [120, 210, 220, 230]; // 1.2, 2.1, 2.2, 2.3
const WEIGHTS  = [0.08, 0.17, 0.30, 0.45];

function pickVersion() {
  const r = Math.random(); let acc = 0;
  for (let i = 0; i < VERSIONS.length; i++) { acc += WEIGHTS[i]; if (r <= acc) return VERSIONS[i]; }
  return VERSIONS.at(-1);
}

async function simulateDevice(i) {
  const deviceHash = crypto.randomBytes(16).toString('hex');
  const versionCode = pickVersion();

  const res = await fetch(`${BASE}/v1/directive?versionCode=${versionCode}&platform=android&locale=he`, {
    headers: { 'X-Api-Key': API_KEY },
  });
  const directive = res.status === 200 ? await res.json() : { status: 'NORMAL' };

  const eventType = directive.status === 'MAINTENANCE' ? 'MAINTENANCE_SHOWN'
    : directive.status.includes('UPDATE') ? 'UPDATE_SHOWN' : 'STATUS_CHECK';

  await fetch(`${BASE}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
    body: JSON.stringify({ deviceHash, eventType, versionCode }),
  });
  if (i % 50 === 0) console.log(`device ${i}: v${versionCode} -> ${directive.status}`);
}

console.log(`Simulating ${COUNT} devices against ${BASE} ...`);
for (let i = 1; i <= COUNT; i++) await simulateDevice(i);
console.log('Done. Run aggregation will fold these into hourly_stats within ~1 minute.');
