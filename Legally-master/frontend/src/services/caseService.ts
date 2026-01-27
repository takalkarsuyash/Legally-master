import { supabase } from '../lib/supabase';
import { Case } from '../types/types';

export const getCases = async (userId: string): Promise<Case[]> => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
  return data || [];
};

export const addCase = async (caseData: Case): Promise<Case> => {
  const { data, error } = await supabase
    .from('cases')
    .insert([caseData])
    .select();

  if (error) {
    console.error('Error adding case:', error);
    throw error;
  }
  return data[0];
};

export const updateCase = async (caseData: Case): Promise<Case> => {
  const { data, error } = await supabase
    .from('cases')
    .update(caseData)
    .eq('id', caseData.id)
    .select();

  if (error) {
    console.error('Error updating case:', error);
    throw error;
  }
  return data[0];
};

export const deleteCase = async (caseId: number): Promise<void> => {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId);

  if (error) {
    console.error('Error deleting case:', error);
    throw error;
  }
};
