const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ipfs = require('../utils/ipfs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Handle file upload
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload file to IPFS using Pinata
        const ipfsResult = await ipfs.uploadFile(
            req.file.path,
            req.file.originalname
        );

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            ipfsHash: ipfsResult.ipfsHash,
            ipfsUrl: ipfsResult.url
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to upload file to IPFS'
        });
    }
});

module.exports = router; 