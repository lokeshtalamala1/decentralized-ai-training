# AI Data Chain Backend

This is the backend server for the AI Data Chain project, a decentralized marketplace for AI datasets. The backend handles file uploads, dataset management, and interactions with the blockchain.

## Features

- File upload and storage management
- Dataset metadata management
- Integration with blockchain smart contracts
- RESTful API endpoints for frontend communication
- Secure file handling and validation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Local Ethereum network (Hardhat)
- IPFS node (for file storage)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3001
CONTRACT_ADDRESS=your_contract_address
NETWORK_ID=1337
IPFS_API_URL=your_ipfs_api_url
```

3. Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:3001`.

## Project Structure

- `src/` - Main source code
  - `app.js` - Express application setup
  - `routes/` - API route handlers
  - `controllers/` - Business logic
  - `middleware/` - Custom middleware
  - `utils/` - Utility functions
- `uploads/` - Temporary file storage
- `scripts/` - Utility scripts
- `contracts/` - Smart contract ABIs and addresses

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests (if configured)

## API Documentation

Detailed API documentation can be found in [API.md](./API.md).

## Technologies Used

- Node.js
- Express.js
- Multer (for file uploads)
- Axios
- IPFS
- Web3.js
- CORS 