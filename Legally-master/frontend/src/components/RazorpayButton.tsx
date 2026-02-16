import React, { useState } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { useWallet } from "../contexts/WalletContext";
import { ABI } from "../contracts/abi";
import { toast } from "react-toastify";

interface RazorpayButtonProps {
  // Payment details
  amount: number;
  currency?: string;
  name: string;
  description: string;

  // Optional payment metadata
  lawyerId?: string;
  lawyerName?: string;
  productId?: string;
  category?: string;

  // Button customization
  buttonText?: string;
  buttonClassName?: string;
  icon?: React.ReactNode;
  // User prefill data
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  // Theme
  themeColor?: string;

  // Loading state
  loadingText?: string;

  // Disabled state
  disabled?: boolean;

  // Events
  onPaymentSuccess?: (response: any) => void;
  onPaymentFailure?: (response: any) => void;
  onPaymentError?: (error: any) => void;
}

const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  buttonText = "Pay Now",
  buttonClassName = "flex gap-2 justify-center items-center px-6 py-3 w-full font-medium text-white bg-primary-600 rounded-xl transition-colors duration-200 hover:bg-primary-700",
  icon,
  loadingText = "Processing...",
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const contractAddress: string = import.meta.env.VITE_CONTRACT_ADDRESS || "";
  const { walletAddress, isConnected, connectWallet } = useWallet();

  const handlePayment = async () => {
    if (disabled || isLoading) return;
    const providerInstance = new ethers.BrowserProvider(window.ethereum);
    const signer = await providerInstance.getSigner();
    try {
      if (walletAddress === null || !isConnected) {
        await connectWallet();
      }
      const contractInstance = new ethers.Contract(
        contractAddress,
        ABI,
        signer
      );

      console.log("Contract Instance: ", contractInstance);
      const tx = await contractInstance.deposit();
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      toast.success("Payment successful!");
      console.log("Transaction: ", tx);
      setIsLoading(false);
    } catch (error) {
      console.log("Error in handlePayment:", error);
    }
  };

  return (
    <motion.button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      className={`${buttonClassName} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${isLoading ? "opacity-75" : ""}`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {buttonText}
        </>
      )}
    </motion.button>
  );
};

export default RazorpayButton;
