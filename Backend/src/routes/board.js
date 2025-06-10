import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Board from '../models/Board.js';
import TimeTrack from '../models/TimeTrack.js';
import AuditTrail from '../models/AuditTrail.js';
import { info, error, warn } from '../utils/logger.js';
import { getBoardAttributes } from '../services/isoplus.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    try {
        const existingBoard = await Board.findOne({ boardId: req.body.id });
        if (existingBoard) {
            warn('Board-Service', 'Board already exsit', { boardId: req.body.boardId }, req);
            res.status(200).json({ board: existingBoard });
        } else {
            const newBoard = new Board({
                boardId: req.body.id || '',
                name: req.body.name || '',
                color: req.body.color || '',
                description: req.body.color || '',
                og_image: req.body.og_image || '',
            });
            await newBoard.save();
            AuditTrail.insertOne({ workspaceId: req.body.workspaceId, action: 'Created new Board', detail: `Resourse ID: ${newBoard._id}`, userEmail: req.user.email, userIp: req.ip?.split(':').pop() });
            info('Board-Service', 'New board created', { boardId: req.body.id }, req);
            res.status(200).json({ board: newBoard });
        }
    } catch (err) {
        error('Board-Service', 'Server error', { message: err.message }, req);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const existingBoard = await Board.findOne({ boardId: req.query.id });

        if (existingBoard) {
            info('Board-Service', 'Successfully fetching board detail data', { boardId: req.query.id }, req);
            res.status(200).json({ board: existingBoard });
        } else {
            warn('Board-Service', 'Failed fetching board detail data', { boardId: req.query.id }, req);
            res.status(200).json({ message: 'Board not found' });
        }
    } catch (err) {
        error('Board-Service', 'Server error', { message: err.message }, req);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/', authenticateToken, async (req, res) => {
    try {
        const result = await Board.updateOne({ boardId: req.body.boardId }, { $set: { ...req.body } }, { upsert: true });
        if (result.nModified === 0) {
            warn('Board-Service', 'Board not found', { boardId: req.body.id }, req);
            res.status(404).json({ message: 'Board not found' });
        } else {
            const updatedBoard = await Board.findOne({ boardId: req.body.boardId });
            info('Board-Service', 'Board updated', { boardId: req.body.boardId, label: req.body.label, attributeId: req.body.attribute.id }, req);
            AuditTrail.insertOne({ workspaceId: req.body.workspaceId, action: 'Updated Board', detail: `Changed Board detail: ${req.body.label? "Label:" + req.body.label + ", " : ""}${req.body.attribute.id? "Attribute ID: " + req.body.attribute.id : ""}`, userEmail: req.user.email, userIp: req.ip?.split(':').pop() });
            res.status(200).json({ board: updatedBoard });
        }
    } catch (err) {
        error('Board-Service', 'Server error', { message: err.message }, req);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/attribute', authenticateToken, async (req, res) => {
    try {
        const attributes = await getBoardAttributes(req.query.workspaceId, req.query.boardId);
        const data = attributes.attribute.filter(item => item.type == "text" || item.type == "longtext");
        if (!data) {
            warn('Board-Service', 'Failed fetching board attribute data', { boardId: req.query.boardId }, req);
            return res.status(404).json({ message: 'Attribute not found' });
        }
        res.status(attributes.status).json({ attributes: data || [] });
    } catch (err) {
        error('Board-Service', 'Server error', { message: err.message }, req);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;