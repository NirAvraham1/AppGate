import crypto from 'crypto';

// New hash on every change; identical ETag -> empty 304 response.
export function computeEtag(obj) {
  return crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex').slice(0, 8);
}
