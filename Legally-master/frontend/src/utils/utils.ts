import { Case, Reminder, Event } from '../types/types';

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const sortByDate = <T extends { date: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const filterItemsBySearch = <T extends { id: string; title: string }>(items: T[], searchQuery: string): T[] => {
  const lowercaseQuery = searchQuery.toLowerCase();
  return items.filter(item => item.title.toLowerCase().includes(lowercaseQuery));
};

export const combineEvents = (cases: Case[], reminders: Reminder[]): Event[] => {
  const caseEvents: Event[] = cases.map(case_ => ({
    id: case_.id?.toString() || '',
    title: case_.title,
    date: case_.date,
    time: '09:00', // Default time for cases
    priority: 'high' as const,
    type: 'hearing' as const
  }));

  const reminderEvents: Event[] = reminders.map(reminder => ({
    ...reminder,
    type: 'reminder' as const
  }));

  return sortByDate([...caseEvents, ...reminderEvents]);
};