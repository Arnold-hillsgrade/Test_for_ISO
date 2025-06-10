import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import AuditTrail from '../models/AuditTrail.js';
import { info, error } from '../utils/logger.js';

const router = express.Router();

// GET all audit trails
router.get('/', authenticateToken, async (req, res) => {
    try {
        const auditTrails = await AuditTrail.find({ workspaceId: req.query.workspaceId });
        info('AuditTrail-Service', 'Audit trails fetched successfully', { count: auditTrails.length }, req);
        res.json(auditTrails);
    } catch (err) {
        error('AuditTrail-Service', 'Error fetching audit trails', { error: err.message }, req);
        res.status(500).json({ message: err.message });
    }
});

// POST a new audit trail
router.post('/', authenticateToken, async (req, res) => {
    const auditTrail = new AuditTrail({
        workspaceId: req.body.workspaceId,
        action: req.body.action,
        detail: req.body.detail,
        userEmail: req.user.email,
        userIP: req.ip?.split(':').pop()
    });

    try {
        const newAuditTrail = await auditTrail.save();
        info('AuditTrail-Service', 'New Audit trail created', { auditTrailId: newAuditTrail._id }, req);
        res.status(201).json(newAuditTrail);
    } catch (err) {
        error('AuditTrail-Service', 'Error creating new Audit trail', { error: err.message }, req);
        res.status(400).json({ message: err.message });
    }
});

// PUT to update an audit trail by ID
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const auditTrail = await AuditTrail.find({ _id: req.params.id, workspaceId: req.body.workspaceId });
        if (!auditTrail) {
            return res.status(404).json({ message: 'AuditTrail not found' });
        }

        auditTrail.action = req.body.action || auditTrail.action;
        auditTrail.detail = req.body.detail || auditTrail.detail;
        auditTrail.userEmail = req.body.userEmail || auditTrail.userEmail;
        auditTrail.userIP = req.body.userIP || auditTrail.userIP;

        const updatedAuditTrail = await auditTrail.save();
        info('AuditTrail-Service', 'Audit trail updated', { auditTrailId: updatedAuditTrail._id }, req);
        res.json(updatedAuditTrail);
    } catch (err) {
        error('AuditTrail-Service', 'Error updating Audit trail', { error: err.message }, req);
        res.status(400).json({ message: err.message });
    }
});

export default router;