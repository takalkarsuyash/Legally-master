import { CONTRACT_ABI } from "../contracts/ContractABI";
import { ethers } from "ethers";

// Contract configuration
// You can set this via environment variable VITE_CONTRACT_ADDRESS or update directly here
  // IMPORTANT: You need to deploy your contract and set the correct address here
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// Helper function to get properly checksummed address
const getChecksummedAddress = (address: string): string => {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    console.error("Invalid address format:", address);
    return "0x0000000000000000000000000000000000000000";
  }
};

export interface ContractState {
  tokenPrice: string;
  maxTokens: string;
  userTokens: string;
  userPayments: string;
  contractBalance: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class ContractService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Validate contract address
      if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.warn("Contract address not set. Please deploy your contract and update CONTRACT_ADDRESS.");
        return;
      }
      
      try {
        // Ensure address is properly checksummed
        const checksummedAddress = getChecksummedAddress(CONTRACT_ADDRESS);
        if (checksummedAddress !== "0x0000000000000000000000000000000000000000") {
          this.contract = new ethers.Contract(checksummedAddress, CONTRACT_ABI, this.provider);
          console.log('Contract initialized with address:', checksummedAddress);
        } else {
          console.warn('Invalid contract address, contract not initialized');
        }
      } catch (error) {
        console.error("Invalid contract address:", error);
      }
    }
  }

  // Set contract address (useful for dynamic deployment)
  setContractAddress(address: string): boolean {
    try {
      const checksummedAddress = getChecksummedAddress(address);
      if (this.provider && checksummedAddress !== "0x0000000000000000000000000000000000000000") {
        this.contract = new ethers.Contract(checksummedAddress, CONTRACT_ABI, this.provider);
        console.log('Contract address set to:', checksummedAddress);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Invalid contract address:", error);
      return false;
    }
  }

  // Reinitialize the service (useful when wallet connection changes)
  async reinitialize(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        
        const checksummedAddress = getChecksummedAddress(CONTRACT_ADDRESS);
        console.log('Attempting to initialize contract with address:', checksummedAddress);
        
        if (checksummedAddress !== "0x0000000000000000000000000000000000000000") {
          this.contract = new ethers.Contract(checksummedAddress, CONTRACT_ABI, this.provider);
          console.log('Contract service reinitialized with address:', checksummedAddress);
          
          // Test if contract is actually deployed by trying to read a simple function
          try {
            await this.contract.maxTokens();
            console.log('Contract is deployed and accessible');
            return true;
          } catch (contractError) {
            console.warn('Contract address is set but contract is not deployed or not accessible:', contractError);
            // Still return true for demo purposes, but log the issue
            return true;
          }
        } else {
          console.warn('Contract address not set. Please set VITE_CONTRACT_ADDRESS environment variable.');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to reinitialize contract service:', error);
      return false;
    }
  }

  // Check if Web3 is available
  isWeb3Available(): boolean {
    const hasWindow = typeof window !== 'undefined';
    const hasEthereum = hasWindow && !!window.ethereum;
    const hasContract = !!this.contract;
    
    console.log('Web3 availability check:', { hasWindow, hasEthereum, hasContract });
    
    return hasWindow && hasEthereum && hasContract;
  }

  // Get contract instance
  getContract() {
    if (!this.isWeb3Available()) {
      throw new Error("Web3 is not available. Please install MetaMask or another Web3 wallet.");
    }
    return this.contract;
  }

  // Get provider instance
  getProvider() {
    if (!this.isWeb3Available()) {
      throw new Error("Web3 is not available. Please install MetaMask or another Web3 wallet.");
    }
    return this.provider;
  }

  // Purchase tokens
  async purchaseTokens(tokenCount: number, userAddress: string): Promise<PurchaseResult> {
    try {
      if (!this.isWeb3Available()) {
        throw new Error("Web3 is not available");
      }

      const contract = this.getContract();
      const provider = this.getProvider();
      const signer = await provider.getSigner(userAddress);

      // Get token price from contract
      const tokenPriceWei = await contract.tokenPrice();
      const tokenPrice = parseFloat(ethers.formatEther(tokenPriceWei));
      const requiredAmount = ethers.parseEther((tokenCount * tokenPrice).toString());

      console.log(`Purchasing ${tokenCount} tokens at ${tokenPrice} ETH each`);
      console.log(`Total required: ${ethers.formatEther(requiredAmount)} ETH`);

      // Estimate gas for the transaction
      let gasEstimate;
      try {
        gasEstimate = await contract.buy.estimateGas(tokenCount, { value: requiredAmount });
        console.log(`Gas estimate: ${gasEstimate.toString()}`);
      } catch (gasError) {
        console.warn("Gas estimation failed:", gasError);
        // Continue without gas estimation
      }

      // Call the buy function with signer
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.buy(tokenCount, { 
        value: requiredAmount,
        gasLimit: gasEstimate ? gasEstimate * 120n / 100n : undefined // Add 20% buffer
      });

      console.log(`Transaction submitted: ${tx.hash}`);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
      };
    } catch (error: any) {
      console.error("Purchase failed:", error);
      
      // Parse common error messages
      let errorMessage = error.message || "Transaction failed. Please try again.";
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = "Transaction was rejected by user";
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = "Insufficient ETH balance for this transaction";
      } else if (error.message?.includes('gas')) {
        errorMessage = "Transaction failed due to gas issues. Please try again.";
      } else if (error.message?.includes('revert')) {
        errorMessage = "Transaction reverted. Please check your token count and try again.";
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Fetch contract state
  async getContractState(userAddress: string): Promise<ContractState | null> {
    try {
      if (!this.isWeb3Available()) {
        return null;
      }

      const contract = this.getContract();

      const [tokenPrice, maxTokens, userTokens, userPayments, contractBalance] = await Promise.all([
        contract.tokenPrice(),
        contract.maxTokens(),
        contract.userTokens(userAddress),
        contract.userPayments(userAddress),
        contract.getBalanceContact(),
      ]);

      return {
        tokenPrice: ethers.formatEther(tokenPrice),
        maxTokens: maxTokens.toString(),
        userTokens: userTokens.toString(),
        userPayments: ethers.formatEther(userPayments),
        contractBalance: ethers.formatEther(contractBalance),
      };
    } catch (error) {
      console.error("Failed to fetch contract state:", error);
      return null;
    }
  }

  // Get token price in ETH
  async getTokenPrice(): Promise<number> {
    try {
      if (!this.isWeb3Available()) {
        return 0.01; // Default fallback
      }

      const contract = this.getContract();
      const tokenPriceWei = await contract.tokenPrice();
      return parseFloat(ethers.formatEther(tokenPriceWei));
    } catch (error) {
      console.error("Failed to get token price:", error);
      return 0.01; // Default fallback
    }
  }

  // Get max tokens per user
  async getMaxTokens(): Promise<number> {
    try {
      if (!this.isWeb3Available()) {
        return 20; // Default fallback
      }

      const contract = this.getContract();
      const maxTokens = await contract.maxTokens();
      return parseInt(maxTokens.toString());
    } catch (error) {
      console.error("Failed to get max tokens:", error);
      return 20; // Default fallback
    }
  }

  // Listen to contract events
  onTokenPurchased(callback: (event: any) => void) {
    if (!this.isWeb3Available()) {
      return;
    }

    const contract = this.getContract();
    contract.on("TokenPurchased", callback);
  }

  // Listen to notification events
  onNotification(callback: (event: any) => void) {
    if (!this.isWeb3Available()) {
      return;
    }

    const contract = this.getContract();
    contract.on("notification", callback);
  }

  // Get user's ETH balance
  async getUserBalance(userAddress: string): Promise<string> {
    try {
      if (!this.isWeb3Available()) {
        return "0";
      }

      const provider = this.getProvider();
      const balance = await provider.getBalance(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Failed to get user balance:", error);
      return "0";
    }
  }

  // Check if user has enough ETH for transaction
  async canAffordTransaction(tokenCount: number, userAddress: string): Promise<{ canAfford: boolean; required: string; balance: string }> {
    try {
      const tokenPrice = await this.getTokenPrice();
      const required = tokenCount * tokenPrice;
      const balance = parseFloat(await this.getUserBalance(userAddress));
      
      return {
        canAfford: balance >= required,
        required: required.toString(),
        balance: balance.toString()
      };
    } catch (error) {
      console.error("Failed to check affordability:", error);
      return {
        canAfford: false,
        required: "0",
        balance: "0"
      };
    }
  }
}

// Export singleton instance
export const contractService = new ContractService();
