# AI Data Chain Frontend

This is the frontend application for the AI Data Chain project, a decentralized marketplace for AI datasets.

## Features

- Connect to Ethereum wallet (MetaMask)
- Browse available datasets
- Purchase dataset licenses
- Upload and manage your own datasets
- View your owned and licensed datasets

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask browser extension
- Local Ethereum network (Hardhat)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
REACT_APP_CONTRACT_ADDRESS=your_contract_address
REACT_APP_NETWORK_ID=1337
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

- `src/components/` - Reusable React components
- `src/pages/` - Page components
- `src/contracts/` - Smart contract ABIs and addresses
- `public/` - Static assets

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Technologies Used

- React
- Web3.js
- Tailwind CSS
- Ethers.js
- React Router 