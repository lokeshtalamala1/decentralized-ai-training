const { Client, ContractFunctionParameters, PrivateKey, Wallet } = require("@hashgraph/sdk");
const { getContractId } = require('./contractRegistry');

// Initialize Hedera client
function getHederaClient() {
    const client = process.env.HEDERA_NETWORK === 'mainnet' 
        ? Client.forMainnet() 
        : Client.forTestnet();
    
    client.setOperator(
        process.env.HEDERA_OPERATOR_ID,
        PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY)
    );
    
    return client;
}

// Get signer for contract interactions
function getSigner(provider) {
    const privateKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);
    return new Wallet(privateKey, provider);
}

// Get contract with signer
function getContractWithSigner(contract, signer) {
    return contract.connect(signer);
}

// Get contract instance
async function getContract(contractName) {
    const client = getHederaClient();
    const contractId = getContractId(contractName);
    
    if (!contractId) {
        throw new Error(`Contract ID not found for ${contractName}`);
    }

    return {
        client,
        contractId,
        execute: async (functionName, params = []) => {
            const contractExecuteTx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(1000000)
                .setFunction(functionName, new ContractFunctionParameters().addParams(params));

            const contractExecuteSubmit = await contractExecuteTx.execute(client);
            const contractExecuteRx = await contractExecuteSubmit.getReceipt(client);
            return contractExecuteRx;
        },
        call: async (functionName, params = []) => {
            const contractCallQuery = new ContractCallQuery()
                .setContractId(contractId)
                .setGas(1000000)
                .setFunction(functionName, new ContractFunctionParameters().addParams(params));

            const contractCallSubmit = await contractCallQuery.execute(client);
            return contractCallSubmit;
        }
    };
}

// Get all contract instances
async function getAllContracts() {
    return {
        datasetRegistry: await getContract('DatasetRegistry'),
        licenseManager: await getContract('LicenseManager'),
        tokenService: await getContract('TokenService')
    };
}

module.exports = {
    getHederaClient,
    getContract,
    getAllContracts,
    getSigner,
    getContractWithSigner
}; 