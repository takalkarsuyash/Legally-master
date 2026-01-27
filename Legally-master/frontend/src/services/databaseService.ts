import { supabase } from '../lib/supabase';
import { UserProfile, UserTokens, TokenTransaction, FEATURE_COSTS } from '../types/database';

export class DatabaseService {
  // User Profile Management
  static async createUserProfile(userId: string, email?: string, name?: string, surname?: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          id: userId, // Explicitly link to auth.users.id
          wallet_id: null,
          username: email?.split('@')[0] || null,
          name: name || null,
          surname: surname || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }

      // Create initial token balance for new user
      await this.createInitialTokenBalance(data.id);

      return data;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return null;
    }
  }

  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }

  // Kept for backward compatibility if needed, but not primary anymore
  static async getUserByWalletId(walletId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_id', walletId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return null;
      }

      return data || null;
    } catch (error) {
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // 1. Try to update Auth Metadata first (Primary Source of Truth now)
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.name ? `${updates.name} ${updates.surname || ''}`.trim() : undefined,
          name: updates.name,
          first_name: updates.name,
          last_name: updates.surname,
          family_name: updates.surname,
          given_name: updates.name
        }
      });

      if (authError) {
        console.error('Error updating auth metadata:', authError);
      }

      // 2. Try to update table (Secondary/Legacy)
      // Only attempt if we think the table exists, acts as "Backup"
      // If table is missing, we just return the constructed profile from auth data
      let tableProfile: UserProfile | null = null;

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user_profiles table:', error);
      } else {
        tableProfile = data;
      }

      // Return combined result
      const meta = authData.user?.user_metadata || {};
      const profileUrl = meta.avatar_url || meta.picture || meta.photoURL;

      return {
        id: userId,
        name: meta.first_name || meta.given_name || updates.name || '',
        surname: meta.last_name || meta.family_name || updates.surname || '',
        email: authData.user?.email || '',
        profile_url: profileUrl,
        ...tableProfile
      };

    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return null;
    }
  }

  // Token Management
  static async createInitialTokenBalance(userId: string): Promise<UserTokens | null> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .insert([{
          user_id: userId,
          token_balance: 1000, // Initial 1000 tokens for new users
          total_earned: 1000,
          total_spent: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating initial token balance:', error);
        return null;
      }

      // Record the initial token grant transaction
      await this.recordTokenTransaction(userId, 'earned', 1000, undefined, 'Initial token grant for new user');

      return data;
    } catch (error) {
      console.error('Error in createInitialTokenBalance:', error);
      return null;
    }
  }

  static async getUserTokens(userId: string): Promise<UserTokens | null> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user tokens:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getUserTokens:', error);
      return null;
    }
  }

  static async updateTokenBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_tokens')
        .update({
          token_balance: newBalance,
          last_transaction: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating token balance:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTokenBalance:', error);
      return false;
    }
  }

  static async spendTokens(userId: string, featureName: string): Promise<{ success: boolean; newBalance?: number; message?: string }> {
    // FREE MODE ACTIVATED: All features are free
    return { success: true, newBalance: 1000, message: 'Free features for all' };
  }

  static async addTokens(userId: string, amount: number, ethAmount: number, transactionHash: string): Promise<{ success: boolean; newBalance?: number; message?: string }> {
    // Kept structurally but functionally deactivated in frontend for now
    return { success: true, message: 'Mock add tokens' };
  }

  // Transaction Management
  static async recordTokenTransaction(
    userId: string,
    type: 'earned' | 'spent' | 'purchased',
    amount: number,
    featureUsed?: string,
    description?: string,
    ethAmount?: number,
    transactionHash?: string
  ): Promise<TokenTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .insert([{
          user_id: userId,
          transaction_type: type,
          amount,
          feature_used: featureUsed,
          eth_amount: ethAmount,
          transaction_hash: transactionHash,
          description
        }])
        .select()
        .single();

      if (error) {
        // Silently fail for logs
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  static async getUserTransactionHistory(userId: string, limit: number = 50): Promise<TokenTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Utility Methods
  static async getOrCreateUser(userId: string, email: string): Promise<UserProfile | null> {
    let user = await this.getUserById(userId);

    if (!user) {
      user = await this.createUserProfile(userId, email);
    }

    return user;
  }
}