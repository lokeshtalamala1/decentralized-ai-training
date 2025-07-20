import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import DatasetRegistry from '../contracts/DatasetRegistry.json';


const HederaContext = createContext();

const HEDERA_NETWORK = {
  testnet: {
    chainId: '0x128',
    chainName: 'Hedera Testnet',
    nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet'],
  },
  mainnet: {
    chainId: '0x127',
    chainName: 'Hedera Mainnet',
    nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
    rpcUrls: ['https://mainnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/mainnet'],
  },
};

export function HederaProvider({ children }) {
  // ─── Hooks ────────────────────────────────────────────────────────────────
  const [account, setAccount]   = useState(null);
  const [network, setNetwork]   = useState('testnet');
  const [client, setClient]     = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError]       = useState(null);

  // ─── Env‐vars ― no hooks here ─────────────────────────────────────────────
  const acctEnv   = process.env.REACT_APP_HEDERA_ACCOUNT_ID;
  let   keyEnv    = process.env.REACT_APP_HEDERA_PRIVATE_KEY || '';
  const CONTRACT_ADDRESS = process.env.REACT_APP_DATASET_CONTRACT_ADDRESS;

  if (keyEnv.startsWith('0x')) keyEnv = keyEnv.slice(2);

  let operatorId, operatorKey, configError;
  try {
    if (!acctEnv || !keyEnv || !CONTRACT_ADDRESS) {
      throw new Error(
        'Please set REACT_APP_HEDERA_ACCOUNT_ID, REACT_APP_HEDERA_PRIVATE_KEY & REACT_APP_CONTRACT_ADDRESS in .env'
      );
    }
    operatorId  = AccountId.fromString(acctEnv);
    operatorKey = PrivateKey.fromString(keyEnv);
  } catch (e) {
    configError = e.message;
  }

  // ─── Effect: MetaMask + SDK init ──────────────────────────────────────────
  useEffect(() => {
    if (configError) {
      setError(configError);
      return;
    }
    if (!window.ethereum) {
      setError('MetaMask not found');
      return;
    }

    const initClientAndContract = (net) => {
      try {
        const hederaClient =
          net === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
        hederaClient.setOperator(operatorId, operatorKey);
        setClient(hederaClient);

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer   = provider.getSigner();
        setContract(new ethers.Contract(
          CONTRACT_ADDRESS,
          DatasetRegistry.abi,
          signer
        ));
      } catch (err) {
        console.error('initClientAndContract error:', err);
        setError(err.message || 'Failed to initialize client & contract');
      }
    };

    // 1) Sync chain & init
    window.ethereum.request({ method: 'eth_chainId' })
      .then(chainId => {
        if (chainId === HEDERA_NETWORK.mainnet.chainId) {
          setNetwork('mainnet');
          initClientAndContract('mainnet');
        } else if (chainId === HEDERA_NETWORK.testnet.chainId) {
          setNetwork('testnet');
          initClientAndContract('testnet');
        } else {
          setError('Please switch MetaMask to a Hedera network');
        }
      })
      .catch(console.error);

    // 2) Auto‐connect if authorized
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accts => { if (accts.length) setAccount(accts[0]); })
      .catch(console.error);

    // 3) Listeners
    const onAccounts = accts => accts.length ? setAccount(accts[0]) : setAccount(null);
    const onChain    = chainId => {
      if (chainId === HEDERA_NETWORK.mainnet.chainId) {
        setNetwork('mainnet'); initClientAndContract('mainnet');
      } else if (chainId === HEDERA_NETWORK.testnet.chainId) {
        setNetwork('testnet'); initClientAndContract('testnet');
      } else {
        setError('Switch MetaMask to a Hedera network');
      }
    };
    window.ethereum.on('accountsChanged', onAccounts);
    window.ethereum.on('chainChanged',    onChain);

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts);
      window.ethereum.removeListener('chainChanged',    onChain);
    };
  }, [configError]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const switchToHederaNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HEDERA_NETWORK[network].chainId }],
      });
      return true;
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [HEDERA_NETWORK[network]],
        });
        return true;
      }
      setError('Could not switch to Hedera network');
      return false;
    }
  };

  const connect = async () => {
    try {
      const [acct] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      setAccount(acct);
      if (!(await switchToHederaNetwork())) return;
      // contract will be re-init by the chainChanged listener
    } catch (err) {
      console.error('connect error:', err);
      setError('Failed to connect');
    }
  };

  const disconnect = () => {
    setAccount(null);
    setClient(null);
    setContract(null);
    setError(null);
  };

  // ─── Contract Interactions ─────────────────────────────────────────────────

  async function registerDataset(ipfsHash, name, description, price, isPublic) {
    if (!contract || !account) {
      throw new Error('Wallet not connected');
    }

    // Register dataset with HBAR price (18 decimals)
    const tx = await contract.registerDataset(
      ipfsHash,
      name,
      description,
      price, // Price is already in HBAR with 18 decimals
      isPublic
    );
    
    await tx.wait();
  }

  const getDatasetCount = async () => {
    if (!contract) throw new Error('Contract not initialized');
    const count = await contract.getDatasetCount();
    await count.wait();
    return count.toNumber() || parseInt(count);
  };

  const getDatasetCid = async (index) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    try {
      const cid = await contract.getDatasetCid(index);
      await cid.wait();
      console.log(`Dataset CID: ${cid}`);
      return cid;
    } catch (err) {
      console.error('Error fetching dataset CID:', err);
      throw err;
    }
  };

  const getDatasetInfo = async (cid) => {
    if (!contract) throw new Error('Contract not initialized');
  
    try {
      const info = await contract.getDatasetInfo(cid);
      await info.wait();
      return {
        cid,
        owner: info.owner,
        price: ethers.utils.formatUnits(info.price, 18), // Changed from 8 to 18 decimals for HBAR
        isPublic: info.isPublic,
        uploadTimestamp: Number(info.uploadTimestamp),
        isRemoved: info.isRemoved,
        name: info.name,
        description: info.description,
      };
    } catch (err) {
      console.error('Failed to fetch dataset info:', err);
      throw err;
    }
  };

  const downloadDataset = async (cid, price) => {
    if (!contract) throw new Error('Contract not initialized');
    const priceInHBAR = ethers.utils.parseUnits(price.toString(), 18); // Changed from 8 to 18 decimals
    const tx = await contract.downloadDataset(cid, { value: priceInHBAR });
    return tx.wait();
  };

  // ─── Render & provide context ──────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <HederaContext.Provider value={{
      account,
      network,
      client,
      contract,
      connect,
      disconnect,
      downloadDataset,
      registerDataset,
      // getDatasetCount,
      getDatasetCid,
      // getDatasetInfo,
    }}>
      {children}
    </HederaContext.Provider>
  );
}

export function useHedera() {
  const ctx = useContext(HederaContext);
  if (!ctx) throw new Error('useHedera must be used within a HederaProvider');
  return ctx;
}
