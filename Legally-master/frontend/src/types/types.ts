export interface Case {
  id?: number;
  user_id?: string;
  title: string;
  court: string;
  date?: string;
  nextHearing?: string;
  status?: string;
  documents?: any[];
  notes: string;
  calendar_event_id?: string;
}

export interface Reminder {
  id: string;
  user_id?: string;
  title: string;
  date: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  calendar_event_id?: string;
}  export interface Event extends Reminder {
    type: 'hearing' | 'meeting' | 'deadline' | 'appointment' | 'reminder';
  }