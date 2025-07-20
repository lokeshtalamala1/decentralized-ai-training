import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import DatasetTokenABI from "../contracts/DatasetToken.json";

const TokenContext = createContext();

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

export function TokenProvider({ children }) {
    const [account, setAccount] = useState(null);
    const [network, setNetwork] = useState('testnet');
    const [client, setClient] = useState(null);
    const [tokenContract, setTokenContract] = useState(null);
    const [error, setError] = useState(null);

    const acctEnv = process.env.REACT_APP_HEDERA_ACCOUNT_ID;
    let keyEnv = process.env.REACT_APP_HEDERA_PRIVATE_KEY || '';
    const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS;

    if (keyEnv.startsWith('0x')) keyEnv = keyEnv.slice(2);

    let operatorId, operatorKey, configError;
    try {
        if (!acctEnv || !keyEnv || !TOKEN_CONTRACT_ADDRESS) {
            throw new Error(
                'Please set REACT_APP_HEDERA_ACCOUNT_ID, REACT_APP_HEDERA_PRIVATE_KEY, and REACT_APP_TOKEN_CONTRACT_ADDRESS in .env'
            );
        }
        operatorId = AccountId.fromString(acctEnv);
        operatorKey = PrivateKey.fromString(keyEnv);
    } catch (e) {
        configError = e.message;
    }

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
                const signer = provider.getSigner();
                setTokenContract(new ethers.Contract(
                    TOKEN_CONTRACT_ADDRESS,
                    DatasetTokenABI.abi,
                    signer
                ));
            } catch (err) {
                console.error('initClientAndContract error:', err);
                setError(err.message || 'Failed to initialize DatasetToken');
            }
        };

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

        window.ethereum.request({ method: 'eth_accounts' })
            .then(accts => { if (accts.length) setAccount(accts[0]); })
            .catch(console.error);

        const onAccounts = accts => accts.length ? setAccount(accts[0]) : setAccount(null);
        const onChain = chainId => {
            if (chainId === HEDERA_NETWORK.mainnet.chainId) {
                setNetwork('mainnet');
                initClientAndContract('mainnet');
            } else if (chainId === HEDERA_NETWORK.testnet.chainId) {
                setNetwork('testnet');
                initClientAndContract('testnet');
            } else {
                setError('Switch MetaMask to a Hedera network');
            }
        };
        window.ethereum.on('accountsChanged', onAccounts);
        window.ethereum.on('chainChanged', onChain);

        return () => {
            window.ethereum.removeListener('accountsChanged', onAccounts);
            window.ethereum.removeListener('chainChanged', onChain);
        };
    }, [configError]);

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
        } catch (err) {
            console.error('connect error:', err);
            setError('Failed to connect');
        }
    };

    const disconnect = () => {
        setAccount(null);
        setClient(null);
        setTokenContract(null);
        setError(null);
    };

    // Contract Interactions
    const mint = async (to, amount) => {
        if (!tokenContract || !account) throw new Error('Wallet not connected');
        const tx = await tokenContract.mint(to, amount);
        await tx.wait();
    };

    const burn = async (from, amount) => {
        if (!tokenContract || !account) throw new Error('Wallet not connected');
        const tx = await tokenContract.burn(from, amount);
        await tx.wait();
    };

    const transfer = async (to, amount) => {
        if (!tokenContract || !account) throw new Error('Wallet not connected');
        const tx = await tokenContract.transfer(to, amount);
        await tx.wait();
    };

    const transferFrom = async (from, to, amount) => {
        if (!tokenContract || !account) throw new Error('Wallet not connected');
        const tx = await tokenContract.transferFrom(from, to, amount);
        await tx.wait();
    };

    const balanceOf = async (address) => {
        if (!tokenContract) throw new Error('Contract not initialized');
        const balance = await tokenContract.balanceOf(address);
        return balance.toString();
    };

    const approve = async (spender, amount) => {
        if (!tokenContract || !account) throw new Error('Wallet not connected');
        const tx = await tokenContract.approve(spender, amount);
        await tx.wait();
    };

    const allowance = async (owner, spender) => {
        if (!tokenContract) throw new Error('Contract not initialized');
        const allowance = await tokenContract.allowance(owner, spender);
        return allowance.toString();
    };

    const pause = async () => {
        if (!tokenContract || !account) throw new Error('Wallet not connected');
        const tx = await tokenContract.pause();
        await tx.wait();
    };

    const unpause = async () => {
        if (!tokenContract || !account) throw new Error('Wallet not connected');
        const tx = await tokenContract.unpause();
        await tx.wait();
    };

    if (error) {
        return (
            <div style={{ padding: 20, color: 'red' }}>
                <h2>Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <TokenContext.Provider value={{
            account,
            network,
            client,
            tokenContract,
            connect,
            disconnect,
            mint,
            burn,
            transfer,
            transferFrom,
            balanceOf,
            approve,
            allowance,
            pause,
            unpause,
        }}>
            {children}
        </TokenContext.Provider>
    );
}

export function useToken() {
    const ctx = useContext(TokenContext);
    if (!ctx) throw new Error('useToken must be used within a TokenProvider');
    return ctx;
}

