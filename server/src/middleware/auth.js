import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Project } from '../models/index.js';

const SECRET = () => process.env.JWT_SECRET || 'dev-secret';

export const hashApiKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

// Devices authenticate with an API Key (X-Api-Key header).
export async function apiKeyAuth(req, res, next) {
  const key = req.header('X-Api-Key');
  if (!key) return res.status(401).json({ error: 'missing X-Api-Key' });
  const project = await Project.findOne({ apiKeyHash: hashApiKey(key) }).lean();
  if (!project) return res.status(401).json({ error: 'invalid API key' });
  req.projectId = project._id;
  req.project = project;
  next();
}

// Portal users authenticate with JWT.
export function jwtAuth(req, res, next) {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    req.user = jwt.verify(token, SECRET());
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

export function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, name: user.name }, SECRET(), { expiresIn: '12h' });
}
