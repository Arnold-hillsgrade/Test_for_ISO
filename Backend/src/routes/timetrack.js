import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getFolder, getItem, putTimeTracking } from '../services/isoplus.js';
import { info, error, warn } from '../utils/logger.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    let tasks = [], myTasks = [];
    const result = await getFolder(req.query.workspaceId, req.query.boardId);

    if (result.status === 200) {
        try {
            for (const folder of result.folder) {
                if (folder.name.includes("Task")) {
                    const result = await getItem(req.query.workspaceId, req.query.boardId, folder.id);
                    if (result.status === 200) {
                        tasks = result.item;
                    }
                }
            }
            for (const task of tasks) {
                const reporterMail = task.values.find(attr => attr.attribute.name === "Reporter's Email Address");
                const taskName = task.values.find(attr => attr.attribute.name === "Name");
                const startTime = task.values.find(attr => attr.attribute.name === "Start Date & Time");
                const endTime = task.values.find(attr => attr.attribute.name === "End Date & Time");
                const location = task.values.find(attr => attr.attribute.name === "Job Location");
                const notes = task.values.find(attr => attr.attribute.name === "Additional Notes");

                if (req.user.email === reporterMail.data) {
                    myTasks.push({
                        id: task.id,
                        taskName: taskName ? taskName.data : "",
                        startTime: startTime ? startTime.data : "",
                        endTime: endTime ? endTime.data : "",
                        location: location ? location.data : "",
                        notes: notes ? notes.data : ""
                    });
                }
            }

            res.status(200).json({ tasks: myTasks });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ message: err.message });
        }
    } else {
        res.status(200).json({ message: result.message });
    }

});

router.put('/', authenticateToken, (req, res) => {
    putTimeTracking(req.body.workspaceId, req.body.boardId, req.body.itemId, req.body.startTime, req.body.endTime);
    return true;
});

export default router;