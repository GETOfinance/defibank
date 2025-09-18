// context/WalletContext.tsx

'use client'

import React, { ReactNode, useEffect, useState } from 'react';
import { createConfig, WagmiProvider, useAccount, useBalance as useWagmiBalance } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { http } from 'viem';
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';

type ExtendedProvider = ethers.providers.ExternalProvider & {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
};

// Define chains

const hederaTestnet = {
  id: 296,
  hexId: '0x128',
  name: 'Hedera Testnet (EVM)',
  network: 'hederatestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api']
    },
    public: {
      http: ['https://testnet.hashio.io/api']
    }
  },
  blockExplorers: {
    default: {
      name: 'Hashscan',
      url: 'https://hashscan.io/testnet'
    }
  },
  testnet: true,
} as const;


const chains = [hederaTestnet] as const;

const projectId = 'b8ad206ba9492e6096fa0aa0f868586c';

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      metaMaskWallet,
    ],
  },
], {
  appName: 'DeFi Bank',
  projectId,
});

const wagmiConfig = createConfig({
  connectors,
  chains,
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
  },
});

const queryClient = new QueryClient();

interface WalletContextType {
  address: string | null;
  balance: string | null;
  signer: ethers.Signer | null;
  isConnected: boolean;
}

const WalletContext = React.createContext<WalletContextType>({
  address: null,
  balance: null,
  signer: null,
  isConnected: false,
});

function WalletState({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<WalletContextType>({
    address: null,
    balance: null,
    signer: null,
    isConnected: false,
  });

  const { address, isConnected } = useAccount();
  const { data: wagmiBalance } = useWagmiBalance({
    address: address as `0x${string}` | undefined,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum && address) {
        try {
          const provider = new ethers.providers.Web3Provider(
            window.ethereum as unknown as ExtendedProvider
          );

          const signer = provider.getSigner();

          let balance: string;
          if (wagmiBalance) {
            balance = ethers.utils.formatEther(wagmiBalance.value.toString());
          } else {
            const ethersBalance = await provider.getBalance(address);
            balance = ethers.utils.formatEther(ethersBalance);
          }

          setState({
            address,
            balance,
            signer,
            isConnected: true,
          });
        } catch (error) {
          console.error('Error initializing wallet:', error);
          setState({
            address: null,
            balance: null,
            signer: null,
            isConnected: false,
          });
        }
      } else if (!address) {
        setState({
          address: null,
          balance: null,
          signer: null,
          isConnected: false,
        });
      }
    };

    const handleAccountsChanged = () => {
      initializeWallet();
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    initializeWallet();

    const ethereum = window.ethereum as unknown as ExtendedProvider;
    if (ethereum?.on) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (ethereum?.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [mounted, address, isConnected, wagmiBalance]);

  useEffect(() => {
    if (wagmiBalance && address && isConnected) {
      try {
        const formattedBalance = ethers.utils.formatEther(wagmiBalance.value.toString());
        setState(prev => ({
          ...prev,
          balance: formattedBalance,
        }));
      } catch (error) {
        console.error('Error formatting balance:', error);
      }
    }
  }, [wagmiBalance, address, isConnected]);

  return (
    <WalletContext.Provider value={state}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#f97316',
            accentColorForeground: 'white',
          })}
          initialChain={hederaTestnet}
        >
          <WalletState>{children}</WalletState>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';