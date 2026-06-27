import { AuditLog } from '../models/index.js';

// Every change is recorded: who, when, what.
// Mandatory in a tool that can switch an app off.
export async function audit(req, action, details = {}) {
  await AuditLog.create({
    projectId: req.projectId,
    userId: req.user?.id,
    userEmail: req.user?.email,
    action,
    details,
  });
}
