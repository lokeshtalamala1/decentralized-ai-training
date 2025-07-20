const { ethers } = require('ethers');
const { setupBlockchainConnection } = require('../utils/blockchain');

// Mock environment variables
process.env.PORT = '3001';
process.env.HEDERA_OPERATOR_ID = '0.0.12345';
process.env.HEDERA_OPERATOR_KEY = '302e020100300506032b657004220420db484b828e64b2d8f12ce3c0a0e93a0b8cce7af1bb8f39c97732394482538e10';
process.env.HEDERA_NETWORK = 'testnet';
process.env.PINATA_API_KEY = 'test_api_key';
process.env.PINATA_SECRET_KEY = 'test_secret_key';
process.env.PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

// Mock blockchain utilities
jest.mock('../utils/blockchain', () => ({
    getSigner: jest.fn().mockReturnValue({
        address: '0x0000000000000000000000000000000000000000',
        signMessage: jest.fn().mockResolvedValue('0x123456'),
        sendTransaction: jest.fn().mockResolvedValue({
            wait: jest.fn().mockResolvedValue({
                status: 1,
                transactionHash: '0x123456'
            })
        })
    }),
    getContractWithSigner: jest.fn().mockReturnValue({
        purchaseLicense: jest.fn().mockResolvedValue({
            wait: jest.fn().mockResolvedValue({
                status: 1,
                transactionHash: '0x123456'
            })
        }),
        revokeLicense: jest.fn().mockResolvedValue({
            wait: jest.fn().mockResolvedValue({
                status: 1,
                transactionHash: '0x123456'
            })
        }),
        registerDataset: jest.fn().mockResolvedValue({
            wait: jest.fn().mockResolvedValue({
                status: 1,
                transactionHash: '0x123456'
            })
        }),
        updateDatasetPrice: jest.fn().mockResolvedValue({
            wait: jest.fn().mockResolvedValue({
                status: 1,
                transactionHash: '0x123456'
            })
        })
    }),
    getContract: jest.fn().mockResolvedValue({
        client: {},
        contractId: '0.0.12345',
        execute: jest.fn().mockResolvedValue({
            getReceipt: jest.fn().mockResolvedValue({
                status: 1,
                transactionHash: '0x123456'
            })
        }),
        call: jest.fn().mockResolvedValue({
            status: 1,
            transactionHash: '0x123456'
        })
    }),
    getAllContracts: jest.fn().mockResolvedValue({
        datasetRegistry: {
            client: {},
            contractId: '0.0.12345'
        },
        licenseManager: {
            client: {},
            contractId: '0.0.12346'
        },
        tokenService: {
            client: {},
            contractId: '0.0.12347'
        }
    })
}));

// Mock ethers
jest.mock('ethers', () => {
    const mockParseUnits = jest.fn().mockReturnValue('1000000000');
    const mockGetBigInt = jest.fn().mockReturnValue(100n);
    const mockParseEther = jest.fn().mockReturnValue('1000000000000000000');
    
    return {
        parseUnits: mockParseUnits,
        parseEther: mockParseEther,
        getBigInt: mockGetBigInt,
        JsonRpcProvider: jest.fn().mockReturnValue({
            getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
            getBlockNumber: jest.fn().mockResolvedValue(1),
            getGasPrice: jest.fn().mockResolvedValue('1000000000')
        }),
        Contract: jest.fn().mockReturnValue({
            connect: jest.fn().mockReturnThis(),
            functions: {}
        }),
        Wallet: jest.fn().mockReturnValue({
            address: '0x0000000000000000000000000000000000000000',
            signMessage: jest.fn().mockResolvedValue('0x123456')
        })
    };
});

// Mock IPFS utility
jest.mock('../utils/ipfs', () => ({
    uploadFile: jest.fn().mockResolvedValue({
        ipfsHash: 'QmTestHash',
        pinSize: 1000,
        timestamp: '2024-01-01T00:00:00.000Z',
        url: 'https://gateway.pinata.cloud/ipfs/QmTestHash'
    }),
    uploadJSON: jest.fn().mockResolvedValue({
        ipfsHash: 'QmTestHash',
        pinSize: 1000,
        timestamp: '2024-01-01T00:00:00.000Z',
        url: 'https://gateway.pinata.cloud/ipfs/QmTestHash'
    }),
    getFile: jest.fn().mockResolvedValue('test file content')
})); 