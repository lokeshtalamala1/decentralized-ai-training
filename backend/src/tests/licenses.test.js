const request = require('supertest');
const express = require('express');
const { JsonRpcProvider } = require('ethers');
const licensesRouter = require('../routes/licenses');
const { getContract } = require('../utils/blockchain');

// Mock the blockchain utilities
jest.mock('../utils/blockchain', () => ({
    getContract: jest.fn(),
    getSigner: jest.fn(),
    getHederaClient: jest.fn()
}));

describe('Licenses API', () => {
    let app;
    let mockLicenseManager;
    let mockDatasetRegistry;
    let mockTokenService;
    let mockSigner;

    beforeAll(() => {
        // Create mock contract instances
        mockLicenseManager = {
            purchaseLicense: jest.fn(),
            revokeLicense: jest.fn(),
            hasValidLicense: jest.fn(),
            connect: jest.fn().mockReturnThis()
        };

        mockDatasetRegistry = {
            datasets: jest.fn(),
            isPublic: jest.fn(),
            connect: jest.fn().mockReturnThis()
        };

        mockTokenService = {
            approve: jest.fn(),
            transferFrom: jest.fn(),
            connect: jest.fn().mockReturnThis()
        };

        mockSigner = {
            getAddress: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000'),
            signMessage: jest.fn(),
            signTransaction: jest.fn()
        };

        // Setup mock implementations
        getContract.mockImplementation((contractName) => {
            switch(contractName) {
                case 'LicenseManager':
                    return Promise.resolve(mockLicenseManager);
                case 'DatasetRegistry':
                    return Promise.resolve(mockDatasetRegistry);
                case 'TokenService':
                    return Promise.resolve(mockTokenService);
                default:
                    return Promise.reject(new Error('Unknown contract'));
            }
        });
    });

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.locals = {
            licenseManager: mockLicenseManager,
            datasetRegistry: mockDatasetRegistry,
            tokenService: mockTokenService,
            signer: mockSigner
        };
        app.use('/api/licenses', licensesRouter);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    describe('POST /api/licenses/purchase', () => {
        it('should purchase license for private dataset successfully', async () => {
            const datasetId = '1';
            const price = '100';
            const owner = '0x1234567890123456789012345678901234567890';

            mockDatasetRegistry.isPublic.mockResolvedValue(false);
            mockLicenseManager.hasValidLicense.mockResolvedValue(false);
            mockTokenService.approve.mockResolvedValue(true);
            mockLicenseManager.purchaseLicense.mockResolvedValue(true);

            const response = await request(app)
                .post('/api/licenses/purchase')
                .send({ datasetId, price, owner });

            expect(response.status).toBe(200);
            expect(mockTokenService.approve).toHaveBeenCalledWith(mockLicenseManager.address, price);
            expect(mockLicenseManager.purchaseLicense).toHaveBeenCalledWith(datasetId, owner);
        });

        it('should not allow purchasing license for public dataset', async () => {
            const datasetId = '1';
            const price = '100';
            const owner = '0x1234567890123456789012345678901234567890';

            mockDatasetRegistry.isPublic.mockResolvedValue(true);

            const response = await request(app)
                .post('/api/licenses/purchase')
                .send({ datasetId, price, owner });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Cannot purchase license for public dataset');
            expect(mockLicenseManager.purchaseLicense).not.toHaveBeenCalled();
        });

        it('should not allow purchasing license twice', async () => {
            const datasetId = '1';
            const price = '100';
            const owner = '0x1234567890123456789012345678901234567890';

            mockDatasetRegistry.isPublic.mockResolvedValue(false);
            mockLicenseManager.hasValidLicense.mockResolvedValue(true);

            const response = await request(app)
                .post('/api/licenses/purchase')
                .send({ datasetId, price, owner });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('License already purchased');
            expect(mockLicenseManager.purchaseLicense).not.toHaveBeenCalled();
        });
    });

    describe('GET /api/licenses/check/:datasetId/:address', () => {
        it('should check license status successfully', async () => {
            const datasetId = '1';
            const address = '0x1234567890123456789012345678901234567890';

            mockLicenseManager.hasValidLicense.mockResolvedValue(true);

            const response = await request(app)
                .get(`/api/licenses/check/${datasetId}/${address}`);

            expect(response.status).toBe(200);
            expect(response.body.hasLicense).toBe(true);
            expect(mockLicenseManager.hasValidLicense).toHaveBeenCalledWith(datasetId, address);
        });
    });

    describe('POST /api/licenses/revoke', () => {
        it('should revoke license successfully', async () => {
            const datasetId = '1';
            const address = '0x1234567890123456789012345678901234567890';

            mockLicenseManager.hasValidLicense.mockResolvedValue(true);
            mockLicenseManager.revokeLicense.mockResolvedValue(true);

            const response = await request(app)
                .post('/api/licenses/revoke')
                .send({ datasetId, address });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('License revoked successfully');
            expect(mockLicenseManager.revokeLicense).toHaveBeenCalledWith(datasetId, address);
        });

        it('should not revoke non-existent license', async () => {
            const datasetId = '1';
            const address = '0x1234567890123456789012345678901234567890';

            mockLicenseManager.hasValidLicense.mockResolvedValue(false);

            const response = await request(app)
                .post('/api/licenses/revoke')
                .send({ datasetId, address });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('No valid license found');
            expect(mockLicenseManager.revokeLicense).not.toHaveBeenCalled();
        });

        it('should handle revocation failure', async () => {
            const datasetId = '1';
            const address = '0x1234567890123456789012345678901234567890';

            mockLicenseManager.hasValidLicense.mockResolvedValue(true);
            mockLicenseManager.revokeLicense.mockRejectedValue(new Error('Revocation failed'));

            const response = await request(app)
                .post('/api/licenses/revoke')
                .send({ datasetId, address });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to revoke license');
        });

        it('should require compliance role for revocation', async () => {
            const datasetId = '1';
            const address = '0x1234567890123456789012345678901234567890';

            mockLicenseManager.hasValidLicense.mockResolvedValue(true);
            mockLicenseManager.revokeLicense.mockRejectedValue(new Error('Caller is not compliance role'));

            const response = await request(app)
                .post('/api/licenses/revoke')
                .send({ datasetId, address });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Caller does not have compliance role');
        });
    });
}); 