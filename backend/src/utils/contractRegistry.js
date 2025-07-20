const fs = require('fs');
const path = require('path');

const CONTRACT_REGISTRY_PATH = path.join(__dirname, '../../contract-registry.json');

// Initialize or load contract registry
function loadContractRegistry() {
    try {
        if (fs.existsSync(CONTRACT_REGISTRY_PATH)) {
            return JSON.parse(fs.readFileSync(CONTRACT_REGISTRY_PATH, 'utf8'));
        }
        return {
            lastDeployed: new Date().toISOString(),
            contracts: {}
        };
    } catch (error) {
        console.error('Error loading contract registry:', error);
        return {
            lastDeployed: new Date().toISOString(),
            contracts: {}
        };
    }
}

// Save contract registry
function saveContractRegistry(registry) {
    try {
        fs.writeFileSync(CONTRACT_REGISTRY_PATH, JSON.stringify(registry, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving contract registry:', error);
        return false;
    }
}

// Update contract ID
function updateContractId(contractName, contractId) {
    const registry = loadContractRegistry();
    registry.contracts[contractName] = {
        id: contractId,
        lastUpdated: new Date().toISOString()
    };
    saveContractRegistry(registry);
}

// Get contract ID
function getContractId(contractName) {
    const registry = loadContractRegistry();
    return registry.contracts[contractName]?.id;
}

// Get all contract IDs
function getAllContractIds() {
    const registry = loadContractRegistry();
    return registry.contracts;
}

module.exports = {
    updateContractId,
    getContractId,
    getAllContractIds
}; 