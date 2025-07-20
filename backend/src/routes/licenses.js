const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { getSigner, getContractWithSigner } = require('../utils/blockchain');

// Get all licenses for a user
router.get('/user/:address', async (req, res) => {
    try {
        const licenseManager = req.app.locals.licenseManager;
        const userAddress = req.params.address;

        const licenses = await licenseManager.getUserLicenses(userAddress);
        const formattedLicenses = await Promise.all(licenses.map(async (datasetId) => {
            const license = await licenseManager.licenses(datasetId, userAddress);
            return {
                datasetId: datasetId.toString(),
                user: userAddress,
                expiryDate: license.expiryDate.toString(),
                isActive: license.isActive
            };
        }));

        res.json(formattedLicenses);
    } catch (error) {
        console.error('Error fetching user licenses:', error);
        res.status(500).json({ error: 'Failed to fetch user licenses' });
    }
});

// Purchase a license
router.post('/purchase', async (req, res) => {
    try {
        const { datasetId, buyer } = req.body;
        
        const licenseManager = req.app.locals.licenseManager;
        const datasetRegistry = req.app.locals.datasetRegistry;
        const provider = req.app.locals.provider;
        const signer = getSigner(provider);
        
        // Get dataset price
        const dataset = await datasetRegistry.datasets(datasetId);
        const price = dataset.price;

        // Get token service for payment
        const tokenService = req.app.locals.tokenService;
        const tokenServiceWithSigner = getContractWithSigner(tokenService, signer);

        // Approve token spending
        const approveTx = await tokenServiceWithSigner.approve(
            licenseManager.target,
            price
        );
        await approveTx.wait();

        // Purchase license
        const licenseManagerWithSigner = getContractWithSigner(licenseManager, signer);
        const tx = await licenseManagerWithSigner.purchaseLicense(datasetId, buyer);
        await tx.wait();

        res.status(201).json({
            message: 'License purchased successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error purchasing license:', error);
        res.status(500).json({ error: 'Failed to purchase license' });
    }
});

// Check if user has active license
router.get('/check/:datasetId/:address', async (req, res) => {
    try {
        const licenseManager = req.app.locals.licenseManager;
        const { datasetId, address } = req.params;

        const hasLicense = await licenseManager.hasValidLicense(datasetId, address);
        const license = await licenseManager.licenses(datasetId, address);

        res.json({
            hasValidLicense: hasLicense,
            licenseDetails: hasLicense ? {
                expiryDate: license.expiryDate.toString(),
                isActive: license.isActive
            } : null
        });
    } catch (error) {
        console.error('Error checking license:', error);
        res.status(500).json({ error: 'Failed to check license status' });
    }
});

// Revoke license (compliance role only)
router.post('/revoke', async (req, res) => {
    try {
        const { datasetId, userAddress } = req.body;
        
        const licenseManager = req.app.locals.licenseManager;
        const provider = req.app.locals.provider;
        const signer = getSigner(provider);
        const licenseManagerWithSigner = getContractWithSigner(licenseManager, signer);

        const tx = await licenseManagerWithSigner.revokeLicense(datasetId, userAddress);
        await tx.wait();

        res.json({
            message: 'License revoked successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error revoking license:', error);
        res.status(500).json({ error: 'Failed to revoke license' });
    }
});

// Extend license validity
router.post('/extend', async (req, res) => {
    try {
        const { datasetId, userAddress, extensionPeriod } = req.body;
        
        const licenseManager = req.app.locals.licenseManager;
        const provider = req.app.locals.provider;
        const signer = getSigner(provider);
        const licenseManagerWithSigner = getContractWithSigner(licenseManager, signer);

        const tx = await licenseManagerWithSigner.extendLicense(
            datasetId,
            userAddress,
            extensionPeriod
        );
        await tx.wait();

        res.json({
            message: 'License extended successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error extending license:', error);
        res.status(500).json({ error: 'Failed to extend license' });
    }
});

module.exports = router; 