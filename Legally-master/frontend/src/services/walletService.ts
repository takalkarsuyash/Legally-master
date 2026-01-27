import { ethers } from 'ethers';

export interface WalletProvider {
  name: string;
  id: string;
  icon: string;
  getProvider: () => any;
  connect: () => Promise<string>;
  isInstalled: () => boolean;
}

export class WalletService {
  private static providers: WalletProvider[] = [
    {
      name: 'MetaMask',
      id: 'metamask',
      icon: '🦊',
      getProvider: () => (window as any).ethereum,
      connect: async () => {
        const provider = (window as any).ethereum;
        if (!provider) throw new Error('MetaMask not installed');
        
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        return accounts[0];
      },
      isInstalled: () => typeof (window as any).ethereum !== 'undefined' && (window as any).ethereum.isMetaMask,
    },
  ];

  static getAvailableWallets(): WalletProvider[] {
    return this.providers.filter(provider => provider.isInstalled());
  }

  static getAllWallets(): WalletProvider[] {
    return this.providers;
  }

  static async connectWallet(walletId: string): Promise<string> {
    const wallet = this.providers.find(p => p.id === walletId);
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not supported`);
    }

    if (!wallet.isInstalled()) {
      throw new Error(`${wallet.name} is not installed`);
    }

    return await wallet.connect();
  }

  static async getCurrentAccount(): Promise<string | null> {
    try {
      const provider = (window as any).ethereum;
      if (!provider) return null;

      const accounts = await provider.request({ method: 'eth_accounts' });
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  }

  static async switchToNetwork(chainId: string): Promise<boolean> {
    try {
      const provider = (window as any).ethereum;
      if (!provider) return false;

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });

      return true;
    } catch (error: any) {
      console.error('Error switching network:', error);
      
      // If the chain doesn't exist, add it
      if (error.code === 4902) {
        return await this.addNetwork(chainId);
      }
      
      return false;
    }
  }

  static async addNetwork(chainId: string): Promise<boolean> {
    try {
      const provider = (window as any).ethereum;
      if (!provider) return false;

      // Network configurations
      const networks: Record<string, any> = {
        '0x1': {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.infura.io/v3/'],
          blockExplorerUrls: ['https://etherscan.io'],
        },
        '0x89': {
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          rpcUrls: ['https://polygon-rpc.com/'],
          blockExplorerUrls: ['https://polygonscan.com'],
        },
        '0xa4b1': {
          chainId: '0xa4b1',
          chainName: 'Arbitrum One',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://arb1.arbitrum.io/rpc'],
          blockExplorerUrls: ['https://arbiscan.io'],
        },
      };

      const networkConfig = networks[chainId];
      if (!networkConfig) {
        throw new Error(`Network ${chainId} not configured`);
      }

      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });

      return true;
    } catch (error) {
      console.error('Error adding network:', error);
      return false;
    }
  }

  static async getNetworkInfo(): Promise<{ chainId: string; networkName: string } | null> {
    try {
      const provider = (window as any).ethereum;
      if (!provider) return null;

      const chainId = await provider.request({ method: 'eth_chainId' });
      
      const networkNames: Record<string, string> = {
        '0x1': 'Ethereum Mainnet',
        '0x89': 'Polygon Mainnet',
        '0xa4b1': 'Arbitrum One',
        '0xaa36a7': 'Sepolia Testnet',
        '0x13882': 'Polygon Mumbai Testnet',
      };

      return {
        chainId,
        networkName: networkNames[chainId] || 'Unknown Network',
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  static async getBalance(address: string): Promise<string> {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  static formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }
}