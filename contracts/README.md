# AI Data Chain Smart Contracts

This directory contains the smart contracts for the AI Data Chain project, a decentralized marketplace for AI datasets. The contracts are built using Solidity and deployed on the Hedera Hashgraph network.

## Features

- Dataset tokenization and ownership management
- License management and distribution
- Royalty distribution system
- Secure payment handling
- Access control and permissions

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Hedera Hashgraph account
- Hedera Testnet access
- Private key for deployment

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PRIVATE_KEY=your_hedera_private_key
```

3. Compile the contracts:
```bash
npm run compile
```

## Project Structure

- `contracts/` - Solidity smart contracts
  - `DatasetToken.sol` - Main dataset token contract
  - `LicenseManager.sol` - License management contract
  - `RoyaltyDistributor.sol` - Royalty distribution contract
- `test/` - Contract test files
- `scripts/` - Deployment and utility scripts
- `artifacts/` - Compiled contract artifacts
- `cache/` - Hardhat compilation cache

## Available Scripts

- `npm run compile` - Compile all contracts
- `npm test` - Run contract tests
- `npm run deploy` - Deploy contracts to testnet

## Network Configuration

The project is configured to work with:
- Hedera Testnet (Chain ID: 296)
- Hedera Mainnet (Chain ID: 295)

## Contract Deployment

To deploy the contracts to testnet:
```bash
npm run deploy
```

## Testing

Run the test suite:
```bash
npm test
```

## Technologies Used

- Solidity (v0.8.19)
- Hardhat
- OpenZeppelin Contracts
- Hedera Hashgraph SDK
- Hardhat Toolbox

## Security Considerations

- All contracts use the latest Solidity version with security features enabled
- OpenZeppelin's battle-tested contracts are used as base implementations
- Contracts include access control and permission management
- Regular security audits are recommended before mainnet deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details. 