import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import { warn, info, error } from '../utils/logger.js';

const router = express.Router();

// Define your Log schema
const logSchema = new mongoose.Schema({
    message: String,
    level: String,
    timestamp: Date,
    metadata: Object,
});

// Create a model from the schema
const Log = mongoose.model('Log', logSchema);

// Route to get logs
router.get('/', authenticateToken, async (req, res) => {
    try {
        if(req.user.role == 'isoplus_user') {
            warn('Log-Service', 'Unauthorized access', { email: req.user.email }, req);
            return res.status(403).json({ message: 'Unauthorized access' });
        }
        const logs = await Log.find();
        info('Log-Service', 'Logs fetched successfully', { count: logs.length }, req);
        res.json(logs);
    } catch (err) {
        error('Log-Service', 'Error fetching logs', { error: err.message }, req);
        res.status(500).json({ message: err.message });
    }
});

export default router;