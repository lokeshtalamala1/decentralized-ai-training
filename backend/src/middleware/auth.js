const { ethers } = require('ethers');

// Middleware to check if the user has admin role
const isAdmin = async (req, res, next) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const tokenService = req.app.locals.tokenService;
        const adminRole = await tokenService.DEFAULT_ADMIN_ROLE();
        const hasRole = await tokenService.hasRole(adminRole, address);

        if (!hasRole) {
            return res.status(403).json({ error: 'Unauthorized: Admin role required' });
        }

        next();
    } catch (error) {
        console.error('Error checking admin role:', error);
        res.status(500).json({ error: 'Failed to verify admin role' });
    }
};

// Middleware to check if the user has compliance role
const hasComplianceRole = async (req, res, next) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const licenseManager = req.app.locals.licenseManager;
        const complianceRole = await licenseManager.COMPLIANCE_ROLE();
        const hasRole = await licenseManager.hasRole(complianceRole, address);

        if (!hasRole) {
            return res.status(403).json({ error: 'Unauthorized: Compliance role required' });
        }

        next();
    } catch (error) {
        console.error('Error checking compliance role:', error);
        res.status(500).json({ error: 'Failed to verify compliance role' });
    }
};

// Middleware to verify dataset ownership
const isDatasetOwner = async (req, res, next) => {
    try {
        const { datasetId, address } = req.body;
        if (!datasetId || !address) {
            return res.status(400).json({ error: 'Dataset ID and address are required' });
        }

        const datasetRegistry = req.app.locals.datasetRegistry;
        const dataset = await datasetRegistry.datasets(datasetId);

        if (dataset.owner.toLowerCase() !== address.toLowerCase()) {
            return res.status(403).json({ error: 'Unauthorized: Only dataset owner can perform this action' });
        }

        next();
    } catch (error) {
        console.error('Error verifying dataset ownership:', error);
        res.status(500).json({ error: 'Failed to verify dataset ownership' });
    }
};

// Middleware to verify valid signature
const verifySignature = async (req, res, next) => {
    try {
        const { message, signature, address } = req.body;
        if (!message || !signature || !address) {
            return res.status(400).json({ error: 'Message, signature, and address are required' });
        }

        const signerAddress = ethers.verifyMessage(message, signature);
        
        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(403).json({ error: 'Invalid signature' });
        }

        next();
    } catch (error) {
        console.error('Error verifying signature:', error);
        res.status(500).json({ error: 'Failed to verify signature' });
    }
};

module.exports = {
    isAdmin,
    hasComplianceRole,
    isDatasetOwner,
    verifySignature
}; 