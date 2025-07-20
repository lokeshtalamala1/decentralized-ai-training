const request = require('supertest');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { JsonRpcProvider } = require('ethers');
const datasetsRouter = require('../routes/datasets');
const { getContract } = require('../utils/blockchain');

// Mock multer for file uploads
jest.mock('multer', () => {
    const multer = () => ({
        single: () => (req, res, next) => {
            req.file = {
                path: 'test/path',
                originalname: 'test.txt'
            };
            next();
        }
    });
    multer.diskStorage = () => jest.fn();
    return multer;
});

describe('Datasets API', () => {
    let app;
    let datasetRegistry;

    beforeAll(async () => {
        // Get actual contract instance
        datasetRegistry = await getContract('DatasetRegistry');
    });

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.locals = {
            datasetRegistry,
            provider: new JsonRpcProvider(process.env.HEDERA_RPC_URL || 'http://localhost:8545')
        };
        app.use('/api/datasets', datasetsRouter);
    });

    describe('POST /api/datasets', () => {
        it('should register a new dataset', async () => {
            const datasetData = {
                name: 'Test Dataset',
                description: 'Test Description',
                price: '1.0',
                isPublic: true
            };

            const response = await request(app)
                .post('/api/datasets')
                .field('name', datasetData.name)
                .field('description', datasetData.description)
                .field('price', datasetData.price)
                .field('isPublic', datasetData.isPublic)
                .attach('file', Buffer.from('test file content'), 'test.txt')
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Dataset registered successfully');
            expect(response.body).toHaveProperty('transactionHash');
            expect(response.body).toHaveProperty('ipfsHash');
        });

        it('should handle missing file upload', async () => {
            const datasetData = {
                name: 'Test Dataset',
                description: 'Test Description',
                price: '1.0',
                isPublic: true
            };

            // Override multer mock to simulate missing file
            jest.spyOn(multer(), 'single').mockImplementation(() => (req, res, next) => next());

            const response = await request(app)
                .post('/api/datasets')
                .send(datasetData)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'No file uploaded');
        });
    });

    describe('GET /api/datasets', () => {
        it('should return list of datasets', async () => {
            const response = await request(app)
                .get('/api/datasets')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('name');
                expect(response.body[0]).toHaveProperty('description');
                expect(response.body[0]).toHaveProperty('price');
                expect(response.body[0]).toHaveProperty('isPublic');
                expect(response.body[0]).toHaveProperty('ipfsHash');
            }
        });
    });

    describe('GET /api/datasets/:id', () => {
        it('should return dataset by ID', async () => {
            // First register a dataset
            const datasetData = {
                name: 'Test Dataset',
                description: 'Test Description',
                price: '1.0',
                isPublic: true
            };

            await request(app)
                .post('/api/datasets')
                .field('name', datasetData.name)
                .field('description', datasetData.description)
                .field('price', datasetData.price)
                .field('isPublic', datasetData.isPublic)
                .attach('file', Buffer.from('test file content'), 'test.txt');

            const response = await request(app)
                .get('/api/datasets/0')
                .expect(200);

            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('description');
            expect(response.body).toHaveProperty('price');
            expect(response.body).toHaveProperty('isPublic');
            expect(response.body).toHaveProperty('ipfsHash');
        });

        it('should handle non-existent dataset', async () => {
            const response = await request(app)
                .get('/api/datasets/999999')
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Dataset not found');
        });
    });
}); 