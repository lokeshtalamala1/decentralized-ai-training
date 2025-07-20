const { Client, PrivateKey, AccountCreateTransaction, Hbar } = require("@hashgraph/sdk");
require('dotenv').config();

async function main() {
    // Create a new Hedera client
    const client = Client.forTestnet();
    
    // Generate a new private key
    const newPrivateKey = PrivateKey.generateED25519();
    const newPublicKey = newPrivateKey.publicKey;

    // Create a new account
    const newAccount = await new AccountCreateTransaction()
        .setKey(newPublicKey)
        .setInitialBalance(Hbar.fromTinybars(1000)) // 1000 tinybars
        .execute(client);

    // Get the new account ID
    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    console.log("\n=== Hedera Account Details ===");
    console.log("Account ID:", newAccountId.toString());
    console.log("Private Key:", newPrivateKey.toString());
    console.log("Public Key:", newPublicKey.toString());
    
    // Save to .env file
    const envContent = `
# Server Configuration
PORT=3001
NODE_ENV=development

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=${newAccountId.toString()}
HEDERA_OPERATOR_KEY=${newPrivateKey.toString()}
HEDERA_OPERATOR_ACCOUNT=${newAccountId.toString()}

# Contract Addresses (Replace with your deployed contract addresses)
DATASET_REGISTRY_CONTRACT_ID=0.0.xxxxxx
LICENSE_MANAGER_CONTRACT_ID=0.0.xxxxxx
TOKEN_SERVICE_CONTRACT_ID=0.0.xxxxxx

# Security
CORS_ORIGIN=http://localhost:3000
`;

    console.log("\nSave these values to your .env file:");
    console.log(envContent);
}

main().catch(console.error); 