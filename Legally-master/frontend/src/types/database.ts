export interface UserProfile {
  id: string;
  wallet_id: string;
  username: string | null;
  name: string | null;
  surname: string | null;
  email?: string;
  profile_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserTokens {
  id: string;
  user_id: string;
  token_balance: number;
  total_earned: number;
  total_spent: number;
  last_transaction: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  transaction_type: 'earned' | 'spent' | 'purchased';
  amount: number;
  feature_used?: string;
  eth_amount?: number;
  transaction_hash?: string;
  description?: string;
  created_at: string;
}

export interface FeatureCost {
  feature_name: string;
  token_cost: number;
  description?: string;
}

export const FEATURE_COSTS: Record<string, number> = {
  'document_query': 10,
  'document_summarization': 15,
  'legal_draft': 25,
  'case_analysis': 20,
  'ai_chat': 5,
  'document_upload': 5,
  'lawyer_consultation': 50,
  'contract_review': 30,
  'legal_research': 15,
};

export const TOKEN_PURCHASE_RATE = {
  ETH_PER_10K_TOKENS: 0.01,
  TOKENS_PER_ETH: 1000000, // 1 ETH = 1M tokens
};