const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { getSigner, getContractWithSigner } = require('../utils/blockchain');

// Get token balance
router.get('/balance/:address', async (req, res) => {
    try {
        const tokenService = req.app.locals.tokenService;
        const balance = await tokenService.balanceOf(req.params.address);
        
        res.json({
            address: req.params.address,
            balance: ethers.formatEther(balance)
        });
    } catch (error) {
        console.error('Error fetching token balance:', error);
        res.status(500).json({ error: 'Failed to fetch token balance' });
    }
});

// Transfer tokens
router.post('/transfer', async (req, res) => {
    try {
        const { to, amount } = req.body;
        
        const tokenService = req.app.locals.tokenService;
        const provider = req.app.locals.provider;
        const signer = getSigner(provider);
        const tokenServiceWithSigner = getContractWithSigner(tokenService, signer);

        const tx = await tokenServiceWithSigner.transfer(
            to,
            ethers.parseEther(amount.toString())
        );
        await tx.wait();

        res.json({
            message: 'Tokens transferred successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error transferring tokens:', error);
        res.status(500).json({ error: 'Failed to transfer tokens' });
    }
});

// Get token allowance
router.get('/allowance/:owner/:spender', async (req, res) => {
    try {
        const tokenService = req.app.locals.tokenService;
        const { owner, spender } = req.params;
        
        const allowance = await tokenService.allowance(owner, spender);
        
        res.json({
            owner,
            spender,
            allowance: ethers.formatEther(allowance)
        });
    } catch (error) {
        console.error('Error fetching allowance:', error);
        res.status(500).json({ error: 'Failed to fetch allowance' });
    }
});

// Approve token spending
router.post('/approve', async (req, res) => {
    try {
        const { spender, amount } = req.body;
        
        const tokenService = req.app.locals.tokenService;
        const provider = req.app.locals.provider;
        const signer = getSigner(provider);
        const tokenServiceWithSigner = getContractWithSigner(tokenService, signer);

        const tx = await tokenServiceWithSigner.approve(
            spender,
            ethers.parseEther(amount.toString())
        );
        await tx.wait();

        res.json({
            message: 'Token approval set successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error approving tokens:', error);
        res.status(500).json({ error: 'Failed to approve tokens' });
    }
});

// Get total token supply
router.get('/total-supply', async (req, res) => {
    try {
        const tokenService = req.app.locals.tokenService;
        const totalSupply = await tokenService.totalSupply();
        
        res.json({
            totalSupply: ethers.formatEther(totalSupply)
        });
    } catch (error) {
        console.error('Error fetching total supply:', error);
        res.status(500).json({ error: 'Failed to fetch total supply' });
    }
});

// Mint tokens (admin only)
router.post('/mint', async (req, res) => {
    try {
        const { to, amount } = req.body;
        
        const tokenService = req.app.locals.tokenService;
        const provider = req.app.locals.provider;
        const signer = getSigner(provider);
        const tokenServiceWithSigner = getContractWithSigner(tokenService, signer);

        const tx = await tokenServiceWithSigner.mint(
            to,
            ethers.parseEther(amount.toString())
        );
        await tx.wait();

        res.json({
            message: 'Tokens minted successfully',
            transactionHash: tx.hash
        });
    } catch (error) {
        console.error('Error minting tokens:', error);
        res.status(500).json({ error: 'Failed to mint tokens' });
    }
});

module.exports = router; 