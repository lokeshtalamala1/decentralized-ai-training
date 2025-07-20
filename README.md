# Distributed Trust – AI Model Training Data (Group 2)

## Description:
This project aims to create a decentralized platform for managing and sharing AI model training data using blockchain technology. The platform will ensure data integrity, transparency, and fair compensation for data contributors while maintaining privacy and security.

Key Features:
- Smart Contract-based data marketplace
- IPFS integration for decentralized data storage
- Secure and transparent data sharing mechanism
- Modern React.js frontend for better user experience

The project leverages blockchain technology to create a trustless environment where AI researchers and data providers can interact directly, eliminating the need for intermediaries. This ensures fair compensation for data contributors while maintaining data quality and authenticity.

📦 Required Libraries and Packages

### Smart Contract Development:
- hardhat: Development environment for Ethereum
- @openzeppelin/contracts: Secure smart contract libraries
- @nomiclabs/hardhat-ethers: Hardhat plugin for ethers.js
- @nomiclabs/hardhat-waffle: Hardhat plugin for Waffle
- chai: Testing framework
- ethereum-waffle: Testing framework for smart contracts

### Backend Development:
- express: Web framework for Node.js
- ipfs-http-client: IPFS client library
- multer: File upload handling
- cors: Cross-origin resource sharing
- dotenv: Environment variable management
- ethers: Ethereum library for interacting with smart contracts
- web3: Ethereum JavaScript API

### Frontend Development:
- react: UI library
- ethers: Ethereum library for frontend
- bootstrap: CSS framework
- web3-react: React framework for Ethereum
- axios: HTTP client
- react-router-dom: Routing library
- @mui/material: Material UI components
- @emotion/react: CSS-in-JS library
- @emotion/styled: Styled components

### Development Tools:
- typescript: Type checking
- eslint: Code linting
- prettier: Code formatting
- nodemon: Development server with auto-reload


Team Members & Roles

Name                  | Roll No     | Role
----------------------|-------------|----------------------------------
Vishnu Vardhan        | CS24M022    | Project Lead / Deployment
Lokesh Talamala	      | CS24M023    | Frontend Developer
Dinesh Naik Katravath | CS24M018    | Smart Contract & Token Developer
Dinesh Kumar S        | CS24M017    | Backend & IPFS Developer


------------------------------------------------------------

🚀 Project Setup and Running Instructions

1. Prerequisites
   - Node.js (v16 or higher)
   - npm (v8 or higher)
   - Git
   - MetaMask browser extension
   - IPFS daemon (for local development)

2. Clone and Setup
   ```bash
   # Clone the repository
   git clone https://github.com/Vishnu000000/DT_Group2_Project.git
   cd DT_Group2_Project

    ```
3. Install Node.js & npm
- Download LTS version: https://nodejs.org/
- Verify:
```
node -v
npm -v
```

4. Compiling and Deploying the Smart Contract (compile only once)

- Before depolying update the .env file with the Hedera Testnet account information.(PRIVATE_KEY,HEDERA_OPERATOR_ID,HEDERA_OPERATOR_KEY)
```
npm install --save-dev hardhat
npx hardhat compile
npx hardhat run scripts/deploy.js --network testnet 
 
```
- Work inside: contracts/, scripts/, test/

5. Setting up Backend
```
cd backend
npm init
npm run dev
```
- Work inside: backend/

6. Setting up Frontend

- Once the contract is deployed update the address of the contract in
   the Frontend .env variable.(REACT_APP_TOKEN_CONTRACT_ADDRESS, REACT_APP_LICENSE_CONTRACT_ADDRESS,REACT_APP_DATASET_CONTRACT_ADDRESS)
- In contracts directory there will be arifacts genearted once contracts are compiled, in that artifacts directory there is contracts directory yu can find .json in which abis are present also, place all of them in contracts directory inside frontend.
```
cd frontend
npm init
npm start

```
- Work inside: frontend/

7. Access the Application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

8. Testing
   ```bash
   # Test smart contracts
   cd contracts
   npx hardhat test

   # Test backend
   cd backend
   npm test

   # Test frontend
   cd frontend
   npm test
   ```

8. Common Issues and Solutions
   - If MetaMask connection fails, ensure you're on the correct network
   - If IPFS connection fails, verify IPFS daemon is running
   - For contract deployment issues, check your private key and network configuration
   - For frontend build issues, clear node_modules and reinstall dependencies


------------------------------------------------------------
