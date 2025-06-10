import express from 'express';
import PDFLink from '../models/PDFLink.js';

const router = express.Router();

// GET all PDF links
router.get('/', async (req, res) => {
    try {
        const pdfLinks = await PDFLink.find({ workspaceId: req.query.workspaceId });
        res.json(pdfLinks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET selected PDF links
router.get('/:id', async (req, res) => {
    try {
        const pdfLinks = await PDFLink.find({ workspaceId: req.query.workspaceId, itemId: req.params.id });
        res.json(pdfLinks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new PDF link
router.post('/', async (req, res) => {
    const pdfLink = new PDFLink({
        itemId: req.body.itemId,
        workspaceId: req.body.workspaceId,
        pdfLink: req.body.pdfLink,
        SignatureStatus: req.body.SignatureStatus,
        type: req.body.type,
        createdBy: req.body.createdBy || "xxx"
    });

    try {
        const newPDFLink = await pdfLink.save();
        res.status(201).json(newPDFLink);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update a PDF link
router.put('/', async (req, res) => {
    try {
        const pdfLink = await PDFLink.findOne({ itemId: req.body.itemId, workspaceId: req.body.workspaceId, pdfLink: req.body.pdfLink });
        if (!pdfLink) {
            return res.status(404).json({ message: 'PDF not found' });
        }

        pdfLink.isDeleted = true;

        const updatedPDFLink = await pdfLink.save();
        res.json(updatedPDFLink);
    } catch (err) {
        // res.status(400);
    }
});

export default router;