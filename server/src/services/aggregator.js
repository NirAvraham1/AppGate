// eventAggregator: a job that rolls raw events into hourly summaries.
// "How many saw maintenance per version" on raw = scanning every event on
// every refresh. On the summary = a few dozen rows. O(hours) not O(events).
import { TelemetryEvent, HourlyStats } from '../models/index.js';

let watermark = new Date(0);

export async function runAggregation() {
  const until = new Date();
  const events = await TelemetryEvent.find({ timestamp: { $gt: watermark, $lte: until } }).lean();
  if (events.length === 0) { watermark = until; return 0; }

  const buckets = new Map();
  for (const e of events) {
    const hour = new Date(e.timestamp); hour.setMinutes(0, 0, 0);
    const key = `${e.projectId}|${hour.toISOString()}|${e.eventType}|${e.versionCode}`;
    const b = buckets.get(key) || { projectId: e.projectId, hourBucket: hour, eventType: e.eventType, versionCode: e.versionCode, count: 0 };
    b.count++; buckets.set(key, b);
  }
  const ops = [...buckets.values()].map(b => ({
    updateOne: {
      filter: { projectId: b.projectId, hourBucket: b.hourBucket, eventType: b.eventType, versionCode: b.versionCode },
      update: { $inc: { count: b.count } },
      upsert: true,
    },
  }));
  await HourlyStats.bulkWrite(ops);
  watermark = until;
  return events.length;
}

export function startAggregatorJob(intervalMs = 60_000) {
  setInterval(() => runAggregation().catch(e => console.error('[aggregator]', e.message)), intervalMs);
  console.log('[aggregator] job started (every', intervalMs / 1000, 'sec)');
}
