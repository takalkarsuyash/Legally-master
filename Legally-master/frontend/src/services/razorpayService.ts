// Razorpay payment service for lawyer consultation booking

interface PaymentData {
  lawyerName: string
  lawyerId: string
  amount: number
  currency?: string
}

// Check required environment variables
const checkRequiredEnvVars = () => {
  const required = ['VITE_RAZORPAY_KEY_ID']
  const missing = required.filter(key => !import.meta.env[key])

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  console.log('✅ All required environment variables are set')
}

// Logger utility
const logPaymentFlow = (stage: string, data?: any) => {
  console.group(`💸 Payment Flow: ${stage}`)
  if (data) console.log(data)
  console.groupEnd()
}

export class RazorpayService {
  private static instance: RazorpayService

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService()
    }
    return RazorpayService.instance
  }

  // Initialize payment - simplified approach like ref.tsx
  async initializePayment(paymentData: PaymentData): Promise<void> {
    try {
      console.log('Free Mode: Skipping Razorpay payment');

      // Simulate successful payment immediately
      logPaymentFlow('Payment Success (Free Mode)', {
        paymentId: 'free_mode_bypass',
        lawyerName: paymentData.lawyerName
      });

      alert(`Booking confirmed with ${paymentData.lawyerName
        }! \n\n(No payment required - Free Mode Active)`);

    } catch (error) {
      console.error('Error in free payment flow:', error);
      alert('Something went wrong. Please try again later.');
    }
  }
}


// Export singleton instance
export const razorpayService = RazorpayService.getInstance()

// Global type declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any
  }
}
