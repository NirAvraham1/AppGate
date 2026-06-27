// In-process cache: one small Directive document per project,
// loaded into memory and refreshed on every save from the portal.
// The DB never feels the read load - no Redis, no extra component.
import { Directive } from '../models/index.js';

const cache = new Map(); // projectId -> directive (plain object)

export async function getDirective(projectId) {
  const key = String(projectId);
  if (cache.has(key)) return cache.get(key);
  const doc = await Directive.findOne({ projectId }).lean();
  if (doc) cache.set(key, doc);
  return doc;
}

export function invalidate(projectId) {
  cache.delete(String(projectId));
}
