const { Client, ContractCreateTransaction, ContractFunctionParameters, PrivateKey, FileCreateTransaction, FileAppendTransaction } = require("@hashgraph/sdk");
const { updateContractId } = require('../src/utils/contractRegistry');
require('dotenv').config();

async function main() {
    // Create a new Hedera client
    const client = Client.forTestnet();
    client.setOperator(
        process.env.HEDERA_OPERATOR_ID,
        PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY)
    );

    // Deploy DatasetRegistry contract
    console.log("Deploying DatasetRegistry contract...");
    const datasetRegistryBytecode = require('../contracts/artifacts/contracts/DatasetRegistry.sol/DatasetRegistry.json').bytecode;
    const datasetRegistryContract = await deployContract(client, datasetRegistryBytecode);
    console.log("DatasetRegistry Contract ID:", datasetRegistryContract.toString());
    updateContractId('DatasetRegistry', datasetRegistryContract.toString());

    // Deploy LicenseManager contract
    console.log("\nDeploying LicenseManager contract...");
    const licenseManagerBytecode = require('../contracts/artifacts/contracts/LicenseManager.sol/LicenseManager.json').bytecode;
    const licenseManagerContract = await deployContract(client, licenseManagerBytecode);
    console.log("LicenseManager Contract ID:", licenseManagerContract.toString());
    updateContractId('LicenseManager', licenseManagerContract.toString());

    // Deploy TokenService contract
    console.log("\nDeploying TokenService contract...");
    const tokenServiceBytecode = require('../contracts/artifacts/contracts/TokenService.sol/TokenService.json').bytecode;
    const tokenServiceContract = await deployContract(client, tokenServiceBytecode);
    console.log("TokenService Contract ID:", tokenServiceContract.toString());
    updateContractId('TokenService', tokenServiceContract.toString());

    console.log("\nContract deployment complete! Contract IDs have been saved to the registry.");
}

async function deployContract(client, bytecode) {
    // Create a file on Hedera
    const fileCreateTx = new FileCreateTransaction()
        .setKeys([client.operatorPublicKey])
        .execute(client);

    const fileCreateReceipt = await fileCreateTx.getReceipt(client);
    const fileId = fileCreateReceipt.fileId;

    // Append the bytecode to the file
    const fileAppendTx = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(bytecode)
        .execute(client);

    await fileAppendTx.getReceipt(client);

    // Create the contract
    const contractCreateTx = new ContractCreateTransaction()
        .setBytecodeFileId(fileId)
        .setGas(1000000)
        .execute(client);

    const contractCreateReceipt = await contractCreateTx.getReceipt(client);
    return contractCreateReceipt.contractId;
}

main().catch(console.error); 