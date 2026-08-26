import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      chainId: string;
    };
  }
}

export const NETWORK_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai',
  56: 'BNB Smart Chain',
  97: 'BNB Testnet',
};

export const ETHERSCAN_URLS: Record<number, string> = {
  1: 'https://etherscan.io',
  5: 'https://goerli.etherscan.io',
  11155111: 'https://sepolia.etherscan.io',
  137: 'https://polygonscan.com',
  80001: 'https://mumbai.polygonscan.com',
  56: 'https://bscscan.com',
  97: 'https://testnet.bscscan.com',
};

export function useMetaMask() {
  const { setWallet, disconnectWallet, wallet } = useUserStore();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);

  const getNetworkName = useCallback((chainId: number | null) => {
    if (!chainId) return 'Unknown Network';
    return NETWORK_NAMES[chainId] || `Chain ID: ${chainId}`;
  }, []);

  const getEtherscanUrl = useCallback((chainId: number | null, address: string) => {
    if (!chainId || !address) return '';
    const baseUrl = ETHERSCAN_URLS[chainId] || 'https://etherscan.io';
    return `${baseUrl}/address/${address}`;
  }, []);

  const fetchBalance = useCallback(async (address: string): Promise<string> => {
    if (!window.ethereum) return '0';
    
    try {
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }) as string;
      
      const balanceWei = parseInt(balanceHex, 16);
      const balanceEth = balanceWei / 1e18;
      return balanceEth.toFixed(4);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask chưa được cài đặt',
        description: 'Vui lòng cài đặt MetaMask để tiếp tục',
        variant: 'destructive',
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const chainIdHex = window.ethereum.chainId;
      const chainId = parseInt(chainIdHex, 16);
      const ethBalance = await fetchBalance(address);

      setWallet({
        address,
        ethBalance,
        chainId,
        connected: true,
        balance: 0, // CAMLY balance from internal system
      });

      toast({
        title: 'Kết nối thành công! ✨',
        description: `Đã kết nối với ${getNetworkName(chainId)}`,
      });
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err.code === 4001) {
        toast({
          title: 'Từ chối kết nối',
          description: 'Bạn đã từ chối kết nối ví MetaMask',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Lỗi kết nối',
          description: err.message || 'Không thể kết nối với MetaMask',
          variant: 'destructive',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance, getNetworkName, setWallet, toast]);

  const disconnect = useCallback(() => {
    disconnectWallet();
    toast({
      title: 'Đã ngắt kết nối',
      description: 'Ví MetaMask đã được ngắt kết nối',
    });
  }, [disconnectWallet, toast]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum || !wallet.connected) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        disconnect();
      } else {
        const newAddress = accountsArray[0];
        const ethBalance = await fetchBalance(newAddress);
        setWallet({
          address: newAddress,
          ethBalance,
        });
        toast({
          title: 'Tài khoản đã thay đổi',
          description: `Đã chuyển sang tài khoản mới`,
        });
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const newChainId = parseInt(chainIdHex as string, 16);
      setWallet({ chainId: newChainId });
      toast({
        title: 'Mạng đã thay đổi',
        description: `Đã chuyển sang ${getNetworkName(newChainId)}`,
      });
      // Refresh balance on new chain
      if (wallet.address) {
        fetchBalance(wallet.address).then(ethBalance => {
          setWallet({ ethBalance });
        });
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet.connected, wallet.address, disconnect, fetchBalance, getNetworkName, setWallet, toast]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum || wallet.connected) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        }) as string[];

        if (accounts.length > 0) {
          const address = accounts[0];
          const chainIdHex = window.ethereum.chainId;
          const chainId = parseInt(chainIdHex, 16);
          const ethBalance = await fetchBalance(address);

          setWallet({
            address,
            ethBalance,
            chainId,
            connected: true,
          });
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();
  }, [fetchBalance, setWallet, wallet.connected]);

  return {
    isMetaMaskInstalled,
    isConnecting,
    connectWallet,
    disconnect,
    getNetworkName,
    getEtherscanUrl,
  };
}
