import { ethers } from 'ethers';

// Simple token purchase contract ABI
const TOKEN_PURCHASE_ABI = [
  "function purchaseTokens() external payable",
  "function getTokenRate() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function withdraw() external",
  "event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount)"
];

// For demo purposes - in production, deploy an actual contract
const TOKEN_PURCHASE_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual contract

export class TokenPurchaseService {
  private static contract: ethers.Contract | null = null;
  private static provider: ethers.BrowserProvider | null = null;

  static async initialize(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet provider found');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await this.provider.getSigner();
      
      // For demo, we'll simulate contract calls
      // In production, you'd use: 
      // this.contract = new ethers.Contract(TOKEN_PURCHASE_CONTRACT_ADDRESS, TOKEN_PURCHASE_ABI, signer);
      
      return true;
    } catch (error) {
      console.error('Error initializing token purchase service:', error);
      return false;
    }
  }

  static async purchaseTokens(ethAmount: number): Promise<{ success: boolean; transactionHash?: string; tokenAmount?: number; error?: string }> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      if (!this.provider) {
        throw new Error('Failed to initialize provider');
      }

      const signer = await this.provider.getSigner();
      const ethValue = ethers.parseEther(ethAmount.toString());
      
      // Calculate token amount based on rate (0.01 ETH = 10,000 tokens)
      const tokenAmount = Math.floor(ethAmount * 1000000); // 1 ETH = 1M tokens

      // For demo purposes, we'll send ETH to a demo address
      // In production, you'd call the smart contract
      const transaction = await signer.sendTransaction({
        to: "0x742d35Cc6634C0532925a3b8D769F3C08D9D06b6", // Demo address
        value: ethValue,
        gasLimit: 21000,
      });

      console.log('Transaction sent:', transaction.hash);
      
      // Wait for transaction confirmation
      const receipt = await transaction.wait();
      
      if (receipt && receipt.status === 1) {
        return {
          success: true,
          transactionHash: transaction.hash,
          tokenAmount: tokenAmount,
        };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('Error purchasing tokens:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  static async getTokenRate(): Promise<number> {
    // Return the current rate: 1 ETH = 1M tokens (0.01 ETH = 10k tokens)
    return 1000000;
  }

  static calculateTokenAmount(ethAmount: number): number {
    return Math.floor(ethAmount * 1000000);
  }

  static calculateEthAmount(tokenAmount: number): number {
    return tokenAmount / 1000000;
  }

  static async estimateGasFee(): Promise<string> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      if (!this.provider) {
        return '0.001';
      }

      const feeData = await this.provider.getFeeData();
      const gasLimit = 21000n; // Standard gas limit for ETH transfer
      
      if (feeData.gasPrice) {
        const gasCost = feeData.gasPrice * gasLimit;
        return ethers.formatEther(gasCost);
      }

      return '0.001'; // Fallback estimate
    } catch (error) {
      console.error('Error estimating gas fee:', error);
      return '0.001';
    }
  }

  // Utility functions for token calculations
  static getRecommendedPurchases(): Array<{eth: number, tokens: number, popular?: boolean}> {
    return [
      { eth: 0.01, tokens: 10000, popular: true },
      { eth: 0.05, tokens: 50000 },
      { eth: 0.1, tokens: 100000, popular: true },
      { eth: 0.25, tokens: 250000 },
      { eth: 0.5, tokens: 500000 },
      { eth: 1, tokens: 1000000 },
    ];
  }
}