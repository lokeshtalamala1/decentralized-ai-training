const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { getSigner, getContractWithSigner } = require('../utils/blockchain');
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

const upload = multer({ storage: storage });

// Get all datasets
router.get('/', async (req, res) => {
    try {
        const datasetRegistry = req.app.locals.datasetRegistry;
        const datasetCount = await datasetRegistry.getDatasetCount();
        
        const datasets = [];
        for (let i = 0; i < datasetCount; i++) {
            const dataset = await datasetRegistry.datasets(i);
            datasets.push({
                id: i,
                name: dataset.name,
                description: dataset.description,
                owner: dataset.owner,
                price: ethers.formatEther(dataset.price),
                isPublic: dataset.isPublic,
                ipfsHash: dataset.ipfsHash
            });
        }
        
        res.json(datasets);
    } catch (error) {
        console.error('Error fetching datasets:', error);
        res.status(500).json({ error: 'Failed to fetch datasets' });
    }
});

// Register new dataset
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { name, description, price, isPublic } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload file to IPFS
        const ipfsResult = await ipfs.uploadFile(
            req.file.path,
            req.file.originalname
        );

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        const datasetRegistry = req.app.locals.datasetRegistry;
        const provider = req.app.locals.provider;
        const signer = getSigner(provider);
        const datasetRegistryWithSigner = getContractWithSigner(datasetRegistry, signer);

        const tx = await datasetRegistryWithSigner.registerDataset(
            name,
            description,
            ethers.parseEther(price.toString()),
            isPublic,
            ipfsResult.ipfsHash
        );

        await tx.wait();
        
        res.status(201).json({ 
            message: 'Dataset registered successfully',
            transactionHash: tx.hash,
            ipfsHash: ipfsResult.ipfsHash,
            ipfsUrl: ipfsResult.url
        });
    } catch (error) {
        console.error('Error registering dataset:', error);
        res.status(500).json({ error: 'Failed to register dataset' });
    }
});

// Get dataset by ID
router.get('/:id', async (req, res) => {
    try {
        const datasetRegistry = req.app.locals.datasetRegistry;
        const dataset = await datasetRegistry.datasets(req.params.id);
        
        if (!dataset.owner) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        res.json({
            id: req.params.id,
            name: dataset.name,
            description: dataset.description,
            owner: dataset.owner,
            price: ethers.formatEther(dataset.price),
            isPublic: dataset.isPublic,
            ipfsHash: dataset.ipfsHash
        });
    } catch (error) {
        console.error('Error fetching dataset:', error);
        res.status(500).json({ error: 'Failed to fetch dataset' });
    }
});

// Update dataset price
router.put('/:id/price', async (req, res) => {
    try {
        const { price } = req.body;
        const datasetRegistry = req.app.locals.datasetRegistry;
        const provider = req.app.locals.provider;
        const signer = getSigner(provider);
        const datasetRegistryWithSigner = getContractWithSigner(datasetRegistry, signer);

        const tx = await datasetRegistryWithSigner.updateDatasetPrice(
            req.params.id,
            ethers.parseEther(price.toString())
        );

        await tx.wait();

        res.json({ 
            message: 'Dataset price updated successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error updating dataset price:', error);
        res.status(500).json({ error: 'Failed to update dataset price' });
    }
});

module.exports = router; 