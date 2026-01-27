import React, { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarCheck, Clock, Scale, Briefcase, User } from 'lucide-react';

interface Event {
  date: string;
  title: string;
  time?: string;
  type?: 'hearing' | 'meeting' | 'deadline' | 'appointment' | 'reminder';
}

interface CalendarProps {
  customEvents?: Event[];
}

const Calendar: React.FC<CalendarProps> = ({ customEvents }) => {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Use the custom events from parent component (which come from Supabase)
    if (customEvents && customEvents.length > 0) {
      setEvents(customEvents);
      return;
    }

    // Fallback to route-based events if no custom events provided
    let routeEvents: Event[] = [];

    switch (location.pathname) {
      case '/lawyer':
        routeEvents = [
          {
            date: new Date(2024, 5, 15).toISOString(), // June 15
            title: 'Client Consultation - Smith Case',
            time: '10:00 AM',
            type: 'meeting'
          },
          {
            date: new Date(2024, 5, 20).toISOString(), // June 20
            title: 'Court Hearing - Johnson vs State',
            time: '2:30 PM',
            type: 'hearing'
          },
          {
            date: new Date(2024, 5, 25).toISOString(), // June 25
            title: 'Case File Preparation',
            time: '9:00 AM',
            type: 'deadline'
          }
        ];
        break;

      case '/judge':
        routeEvents = [
          {
            date: new Date(2024, 5, 16).toISOString(), // June 16
            title: 'Criminal Case Review',
            time: '10:00 AM',
            type: 'hearing'
          },
          {
            date: new Date(2024, 5, 22).toISOString(), // June 22
            title: 'Civil Litigation Hearing',
            time: '2:30 PM',
            type: 'hearing'
          },
          {
            date: new Date(2024, 5, 28).toISOString(), // June 28
            title: 'Judicial Conference',
            time: '9:00 AM',
            type: 'meeting'
          }
        ];
        break;

      case '/user':
        routeEvents = [
          {
            date: new Date(2024, 5, 17).toISOString(), // June 17
            title: 'Upcoming Court Hearing',
            time: '11:00 AM',
            type: 'hearing'
          },
          {
            date: new Date(2024, 5, 23).toISOString(), // June 23
            title: 'Legal Consultation Scheduled',
            time: '3:00 PM',
            type: 'appointment'
          },
          {
            date: new Date(2024, 5, 30).toISOString(), // June 30
            title: 'Document Submission Deadline',
            time: '5:00 PM',
            type: 'deadline'
          }
        ];
        break;

      default:
        routeEvents = [];
    }

    setEvents(routeEvents);
  }, [location.pathname, customEvents]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDate = (day: number) => {
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return events.filter(event => new Date(event.date).toDateString() === dateString);
  };

  const renderDays = () => {
    const days: ReactNode[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 text-center opacity-20">
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateEvents = getEventsForDate(day);
      const isToday = day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`
            relative text-center p-2 rounded-lg transition-all duration-200
            ${isToday ? 'border-2 bg-primary/20 border-primary-dark' : ''}
            ${dateEvents.length > 0 ? 'bg-secondary hover:bg-secondary/80 cursor-pointer' : ''}
          `}
        >
          <span className={`
            ${isToday ? 'font-bold text-primary-dark' : ''}
            ${dateEvents.length > 0 ? 'font-semibold' : ''}
          `}>
            {day}
          </span>
          {dateEvents.length > 0 && (
            <div className="absolute right-0 bottom-0 left-0 h-1 rounded-b-lg bg-primary"></div>
          )}
        </div>
      );
    }

    return days;
  };

  const getRouteDetails = () => {
    switch (location.pathname) {
      case '/lawyer':
        return {
          icon: <Briefcase className="mr-2 text-primary" />,
          title: 'Lawyer Schedule'
        };
      case '/judge':
        return {
          icon: <Scale className="mr-2 text-primary" />,
          title: 'Judicial Calendar'
        };
      case '/user':
        return {
          icon: <User className="mr-2 text-primary" />,
          title: 'My Legal Schedule'
        };
      default:
        return {
          icon: <CalendarCheck className="mr-2 text-primary" />,
          title: 'Upcoming Events'
        };
    }
  };

  const { icon, title } = getRouteDetails();

  return (
    <div className="p-6 mx-auto max-w-md rounded-2xl shadow-lg bg-background">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="text-primary-dark" />
        </button>

        <h2 className="text-xl font-bold text-primary-dark">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full transition-colors hover:bg-secondary"
        >
          <ChevronRight className="text-primary-dark" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-sm font-medium text-center opacity-70 text-primary-dark">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {renderDays()}
      </div>

      {events.length > 0 && (
        <div className="pt-4 mt-6 border-t border-secondary">
          <h3 className="flex items-center mb-3 text-lg font-semibold text-primary-dark">
            {icon}
            {title}
          </h3>
          {events.slice(0, 3).map((event, index) => {
            const EventIcon = event.type === 'hearing' ? Scale :
              event.type === 'meeting' ? Briefcase :
                event.type === 'deadline' ? Clock :
                  CalendarCheck;

            return (
              <div
                key={index}
                className={`
                  flex items-center rounded-lg p-3 mb-2
                  ${event.type === 'hearing' ? 'bg-red-50' :
                    event.type === 'meeting' ? 'bg-blue-50' :
                      event.type === 'deadline' ? 'bg-yellow-50' :
                        'bg-secondary/50'}
                `}
              >
                <div className="mr-3">
                  <EventIcon className={`
                    ${event.type === 'hearing' ? 'text-red-500' :
                      event.type === 'meeting' ? 'text-blue-500' :
                        event.type === 'deadline' ? 'text-yellow-500' :
                          'text-primary'}
                  `} />
                </div>
                <div>
                  <p className="font-medium text-primary-dark">{event.title}</p>
                  {event.time && (
                    <div className="flex items-center text-sm text-primary-dark/70">
                      <Clock className="mr-1 w-4 h-4" />
                      {event.time}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Calendar;