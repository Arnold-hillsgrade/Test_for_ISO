import AuditTrail from '../models/AuditTrail.js';

export function logAuditTrail({ workspaceId, action, detail, req }) {
  AuditTrail.create({
    workspaceId,
    action,
    detail,
    userEmail: req.user?.email || "",
    userIp: req.ip?.split(':').pop() || "N/A",
    createdAt: new Date()
  }).catch((err) => {
    console.error('Failed to log audit trail:', err);
  });
}