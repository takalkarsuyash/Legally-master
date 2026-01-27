import { Case, Reminder } from '../types/types';
import { supabase } from '../lib/supabase';

// Fetch cases from Supabase
export const fetchCases = async (): Promise<Case[]> => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error.message);
      return [];
    }

    if (!data) {
      return [];
    }

    // Transform the data to match our Case type
    return data.map(item => ({
      id: item.id,
      title: item.title,
      court: item.court,
      date: item.next_hearing || '',
      nextHearing: item.next_hearing,
      status: item.status,
      documents: item.documents || [],
      notes: item.notes || '',
      calendar_event_id: item.calendar_event_id
    }));
  } catch (err) {
    console.error('Unexpected error fetching cases:', err);
    return [];
  }
};

// Create a new case
export const createCase = async (newCase: Omit<Case, 'id'>): Promise<Case | null> => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .insert([{
        title: newCase.title,
        court: newCase.court,
        next_hearing: newCase.nextHearing || newCase.date,
        status: newCase.status || 'active',
        documents: newCase.documents || [],
        notes: newCase.notes || '',
        calendar_event_id: newCase.calendar_event_id
      }])
      .select();

    if (error) {
      console.error('Error creating case:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.error('No data returned after creating case');
      return null;
    }

    // Transform the returned data
    return {
      id: data[0].id,
      title: data[0].title,
      court: data[0].court,
      date: data[0].next_hearing || '',
      nextHearing: data[0].next_hearing,
      status: data[0].status,
      documents: data[0].documents || [],
      notes: data[0].notes || '',
      calendar_event_id: data[0].calendar_event_id
    };
  } catch (err) {
    console.error('Unexpected error creating case:', err);
    return null;
  }
};

// Update an existing case
export const updateCase = async (updatedCase: Case): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cases')
      .update({
        title: updatedCase.title,
        court: updatedCase.court,
        next_hearing: updatedCase.nextHearing || updatedCase.date,
        status: updatedCase.status || 'active',
        documents: updatedCase.documents || [],
        notes: updatedCase.notes,
        calendar_event_id: updatedCase.calendar_event_id,
        updated_at: new Date()
      })
      .eq('id', updatedCase.id);

    if (error) {
      console.error('Error updating case:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error updating case:', err);
    return false;
  }
};

// Delete a case
export const deleteCase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting case:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting case:', err);
    return false;
  }
};

// Fetch reminders from Supabase
export const fetchReminders = async (): Promise<Reminder[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return [];
    }

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching reminders:', error.message);
      return [];
    }

    if (!data) {
      return [];
    }

    // Transform the data to match our Reminder type
    return data.map(item => ({
      id: item.id,
      title: item.title,
      date: item.date,
      time: item.time,
      priority: item.priority,
      calendar_event_id: item.calendar_event_id
    }));
  } catch (err) {
    console.error('Unexpected error fetching reminders:', err);
    return [];
  }
};

// Create a new reminder
export const createReminder = async (newReminder: Omit<Reminder, 'id'>): Promise<Reminder | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return null;
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert([{
        user_id: user.id,
        title: newReminder.title,
        date: newReminder.date,
        time: newReminder.time,
        priority: newReminder.priority,
        calendar_event_id: newReminder.calendar_event_id
      }])
      .select();

    if (error) {
      console.error('Error creating reminder:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.error('No data returned after creating reminder');
      return null;
    }

    // Transform the returned data
    return {
      id: data[0].id,
      title: data[0].title,
      date: data[0].date,
      time: data[0].time,
      priority: data[0].priority,
      calendar_event_id: data[0].calendar_event_id
    };
  } catch (err) {
    console.error('Unexpected error creating reminder:', err);
    return null;
  }
};

// Update an existing reminder
export const updateReminder = async (updatedReminder: Reminder): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return false;
    }

    const { error } = await supabase
      .from('reminders')
      .update({
        title: updatedReminder.title,
        date: updatedReminder.date,
        time: updatedReminder.time,
        priority: updatedReminder.priority,
        calendar_event_id: updatedReminder.calendar_event_id,
        updated_at: new Date()
      })
      .eq('id', updatedReminder.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating reminder:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error updating reminder:', err);
    return false;
  }
};

// Delete a reminder
export const deleteReminder = async (id: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return false;
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting reminder:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting reminder:', err);
    return false;
  }
};
