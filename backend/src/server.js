require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ethers } = require('ethers');
const { getAllContracts, getSigner } = require('./utils/blockchain');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Initialize blockchain connection
let provider;
let datasetRegistry;
let licenseManager;
let tokenService;

async function initializeBlockchain() {
    try {
        const contracts = await getAllContracts();
        provider = new ethers.JsonRpcProvider(process.env.HEDERA_RPC_URL || 'http://localhost:8545');
        const signer = getSigner(provider);

        datasetRegistry = contracts.datasetRegistry;
        licenseManager = contracts.licenseManager;
        tokenService = contracts.tokenService;

        // Store contracts in app locals for route access
        app.locals = {
            datasetRegistry,
            licenseManager,
            tokenService,
            provider
        };

        console.log('Blockchain connection initialized successfully');
    } catch (error) {
        console.error('Failed to initialize blockchain connection:', error);
        process.exit(1);
    }
}

// Routes
app.use('/api/datasets', require('./routes/datasets'));
app.use('/api/licenses', require('./routes/licenses'));
app.use('/api/tokens', require('./routes/tokens'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
    await initializeBlockchain();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer(); 