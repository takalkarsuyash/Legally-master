import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, Clock, FileText, Bell, Trash2, CheckCircle, Edit, Plus, User, Building, Calendar as CalendarSimple, Check } from 'lucide-react';
import Calendar from '../components/Calender';
import { Case, Reminder } from '../types/types';
import { formatDate, combineEvents } from '../utils/utils';
import {
  fetchReminders,
  createReminder as createReminderApi,
  updateReminder as updateReminderApi,
  deleteReminder as deleteReminderApi
} from '../data/data';
import { getCases, addCase, updateCase, deleteCase } from '../services/caseService';
import { generateNotes } from '../services/asiService';
import { useAuth } from '../contexts/AuthContext';
import { LuNotebookText, LuSparkles } from 'react-icons/lu';
type Tab = 'cases' | 'calendar' | 'reminders';
type Priority = 'high' | 'medium' | 'low';

const AdvocateDiary: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('cases');
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [editingCase, setEditingCase] = useState<number | null>(null);
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCaseForm, setShowCaseForm] = useState<boolean>(false);
  const [showReminderForm, setShowReminderForm] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const [casesData, remindersData] = await Promise.all([
          getCases(user.id),
          fetchReminders()
        ]);
        setCases(casesData);
        setReminders(remindersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleCaseClick = useCallback((caseId: number) => {
    setSelectedCase(prevSelected => prevSelected === caseId ? null : caseId);
  }, []);

  const createCase = useCallback(async (newCase: Omit<Case, 'id' | 'user_id'>) => {
    if (!user) return;
    try {
      const createdCase = await addCase({ ...newCase, user_id: user.id });
      if (createdCase) {
        setCases(prevCases => [...prevCases, createdCase]);
        setShowCaseForm(false);
      }
    } catch (error) {
      console.error('Error creating case:', error);
    }
  }, [user]);

  const handleUpdateCase = useCallback(async (updatedCase: Case) => {
    try {
      const result = await updateCase(updatedCase);
      if (result) {
        setCases(prevCases => prevCases.map(case_ =>
          case_.id === updatedCase.id ? result : case_
        ));
      }
      setEditingCase(null);
    } catch (error) {
      console.error('Error updating case:', error);
    }
  }, []);

  const handleDeleteCase = useCallback(async (id: number) => {
    try {
      await deleteCase(id);
      setCases(prevCases => prevCases.filter(case_ => case_.id !== id));
    } catch (error) {
      console.error('Error deleting case:', error);
    }
  }, []);

  const createReminder = useCallback(async (newReminder: Omit<Reminder, 'id'>) => {
    try {
      const createdReminder = await createReminderApi(newReminder);
      if (createdReminder) {
        setReminders(prevReminders => [...prevReminders, createdReminder]);
        setShowReminderForm(false);
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  }, []);

  const updateReminder = useCallback(async (updatedReminder: Reminder) => {
    try {
      const success = await updateReminderApi(updatedReminder);
      if (success) {
        setReminders(prevReminders => prevReminders.map(reminder =>
          reminder.id === updatedReminder.id ? updatedReminder : reminder
        ));
      }
      setEditingReminder(null);
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    try {
      const success = await deleteReminderApi(id);
      if (success) {
        setReminders(prevReminders => prevReminders.filter(reminder => reminder.id !== id));
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  }, []);

  const combinedEvents = useMemo(() =>
    combineEvents(cases, reminders),
    [cases, reminders]
  );

  const upcomingCases = useMemo(() =>
    cases.slice(0, 3),
    [cases]
  );

  const upcomingReminders = useMemo(() =>
    reminders.filter(reminder => new Date(reminder.date) >= new Date()).slice(0, 3),
    [reminders]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-ambient-pattern"></div>

        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-60 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-20 w-36 h-36 bg-primary/8 rounded-full blur-3xl"></div>

        <div className="container px-4 py-8 mx-auto max-w-7xl relative z-10">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin"></div>
              <div className="absolute inset-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 bg-ambient-pattern"></div>

      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-60 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 left-20 w-36 h-36 bg-primary/8 rounded-full blur-3xl"></div>

      <div className="container px-4 py-4 sm:py-8 mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 sm:mb-12 text-center"
        >
          <div className="mb-4 sm:mb-8">
            <motion.div
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 mb-3 sm:mb-6 text-xs sm:text-sm rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30"
              whileHover={{ scale: 1.05 }}
            >
              <LuNotebookText className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary" />
              <span className="text-primary font-medium">Professional Case Management</span>
            </motion.div>
            <h1 className="mb-2 sm:mb-4 text-2xl sm:text-4xl font-bold tracking-wide lg:text-6xl">
              <span className="text-gray-900">Digitized Advocate</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-secondary">
                Diary & Planner
              </span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              Comprehensive case management, scheduling, and reminder system for legal professionals
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 sm:mb-12"
        >
          <div className="flex p-1.5 sm:p-2 space-x-1 sm:space-x-2 rounded-2xl bg-gradient-to-r from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-xl">
            {[
              { id: 'cases', label: 'Cases', icon: FileText },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'reminders', label: 'Reminders', icon: Bell }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex items-center justify-center px-3 py-2 sm:px-6 sm:py-4 space-x-2 sm:space-x-3 rounded-xl transition-all duration-300 font-semibold text-xs sm:text-base ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                <tab.icon className="w-3 h-3 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'cases' && (
            <motion.div
              key="cases"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3"
            >
              <div className="space-y-4 sm:space-y-6 xl:col-span-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Your Cases</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCaseForm(!showCaseForm)}
                    className="flex items-center px-3 py-1.5 sm:px-6 sm:py-3 space-x-2 sm:space-x-3 text-xs sm:text-base text-white rounded-xl shadow-lg transition-all bg-gradient-to-r from-primary to-primary-dark hover:shadow-xl"
                  >
                    <Plus className="w-3 h-3 sm:w-5 sm:h-5" />
                    <span className="font-semibold">Add Case</span>
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showCaseForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl">
                        <h3 className="mb-3 sm:mb-6 text-lg sm:text-xl font-bold text-gray-900">Add New Case</h3>
                        <CaseForm
                          onSubmit={createCase}
                          onCancel={() => setShowCaseForm(false)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl">
                  <div className="p-4 sm:p-8">
                    <div className="space-y-3 sm:space-y-6">
                      {cases.length === 0 ? (
                        <div className="py-8 sm:py-16 text-center">
                          <motion.div
                            className="flex justify-center items-center mx-auto mb-3 sm:mb-6 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                          </motion.div>
                          <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-gray-900">No Cases Yet</h3>
                          <p className="mb-3 sm:mb-6 text-sm sm:text-base text-gray-600 leading-relaxed px-4">Start by adding your first case to get organized</p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCaseForm(true)}
                            className="px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-base rounded-xl border border-primary/30 transition-all text-primary hover:bg-primary/10 font-semibold"
                          >
                            Add Your First Case
                          </motion.button>
                        </div>
                      ) : (
                        cases.map((case_) => (
                          <motion.div
                            key={case_.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-white/60 shadow-lg transition-all duration-300 hover:shadow-xl"
                          >
                            {editingCase === case_.id ? (
                              <div className="p-3 sm:p-6">
                                <CaseForm
                                  initialData={case_}
                                  onSubmit={(updatedCase) => handleUpdateCase({ ...case_, ...updatedCase })}
                                  onCancel={() => setEditingCase(null)}
                                />
                              </div>
                            ) : (
                              <CaseItem
                                case_={case_}
                                isSelected={selectedCase === case_.id}
                                onEdit={() => setEditingCase(case_.id)}
                                onDelete={handleDeleteCase}
                                onClick={() => case_.id && handleCaseClick(case_.id)}
                              />
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl">
                  <h3 className="flex items-center mb-3 sm:mb-6 text-lg sm:text-xl font-bold text-gray-900">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark mr-3">
                      <CalendarSimple className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Upcoming Cases
                  </h3>
                  {upcomingCases.length === 0 ? (
                    <p className="text-sm sm:text-base text-gray-600 font-medium">No upcoming cases</p>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {upcomingCases.map((case_) => (
                        <div key={case_.id} className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 shadow-lg">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 truncate">{case_.title}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 space-y-1 sm:space-y-0">
                            <span className="flex items-center">
                              <Building className="w-3 h-3 mr-1" />
                              {case_.court}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(case_.date)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl">
                  <h3 className="flex items-center mb-3 sm:mb-6 text-lg sm:text-xl font-bold text-gray-900">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-secondary to-primary mr-3">
                      <Bell className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Upcoming Reminders
                  </h3>
                  {upcomingReminders.length === 0 ? (
                    <p className="text-sm sm:text-base text-gray-600 font-medium">No upcoming reminders</p>
                  ) : (
                    <div className="space-y-2 sm:space-y-4">
                      {upcomingReminders.map((reminder) => (
                        <div key={reminder.id} className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/20 shadow-lg">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 truncate">{reminder.title}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 space-y-1 sm:space-y-0">
                            <span className="flex items-center">
                              <CalendarSimple className="w-3 h-3 mr-1" />
                              {formatDate(reminder.date)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-bold rounded-lg ${reminder.priority === 'high' ? 'bg-red-100 text-red-800' :
                              reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                              {reminder.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl"
            >
              <div className="mb-4 sm:mb-8">
                <h2 className="mb-2 sm:mb-3 text-2xl sm:text-3xl font-bold text-gray-900">Your Schedule</h2>
                <p className="text-sm sm:text-lg text-gray-600">View all your hearings and reminders in one place</p>
              </div>
              <Calendar customEvents={combinedEvents} />
              {!isLoading && combinedEvents.length === 0 && (
                <div className="py-8 sm:py-12 text-center">
                  <motion.div
                    className="flex justify-center items-center mx-auto mb-3 sm:mb-6 w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <CalendarIcon className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                  </motion.div>
                  <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-gray-900">No Events Scheduled</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">Add cases and reminders to see them on your calendar</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reminders' && (
            <motion.div
              key="reminders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-2"
            >
              <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl">
                <div className="flex justify-between items-center mb-4 sm:mb-8">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Add Reminder</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowReminderForm(!showReminderForm)}
                    className="flex items-center px-3 py-1.5 sm:px-6 sm:py-3 space-x-2 sm:space-x-3 text-xs sm:text-base text-white rounded-xl shadow-lg transition-all bg-gradient-to-r from-secondary to-primary hover:shadow-xl"
                  >
                    <Plus className="w-3 h-3 sm:w-5 sm:h-5" />
                    <span className="font-semibold">Add Reminder</span>
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showReminderForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <ReminderForm
                        onSubmit={createReminder}
                        onCancel={() => setShowReminderForm(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showReminderForm && (
                  <div className="py-8 sm:py-12 text-center">
                    <motion.div
                      className="flex justify-center items-center mx-auto mb-3 sm:mb-6 w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Bell className="w-8 h-8 sm:w-12 sm:h-12 text-secondary" />
                    </motion.div>
                    <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-gray-900">Create a New Reminder</h3>
                    <p className="mb-3 sm:mb-6 text-sm sm:text-base text-gray-600 leading-relaxed px-4">Keep track of important dates and deadlines</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowReminderForm(true)}
                      className="px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-base rounded-xl border border-secondary/30 transition-all text-secondary hover:bg-secondary/10 font-semibold"
                    >
                      Add Reminder
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl">
                <h2 className="mb-4 sm:mb-8 text-lg sm:text-2xl font-bold text-gray-900">Your Reminders</h2>
                <div className="space-y-3 sm:space-y-6 max-h-96 sm:max-h-[500px] overflow-y-auto">
                  {reminders.length === 0 ? (
                    <div className="py-8 sm:py-16 text-center">
                      <motion.div
                        className="flex justify-center items-center mx-auto mb-3 sm:mb-6 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Bell className="w-8 h-8 sm:w-12 sm:h-12 text-secondary" />
                      </motion.div>
                      <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-gray-900">No Reminders Yet</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-4">Add your first reminder to stay organized</p>
                    </div>
                  ) : (
                    reminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        className="rounded-2xl bg-gradient-to-br from-white/60 to-white/40 border border-white/20 shadow-lg overflow-hidden"
                      >
                        {editingReminder === reminder.id ? (
                          <div className="p-3 sm:p-6">
                            <ReminderForm
                              initialData={reminder}
                              onSubmit={(updatedReminder) => updateReminder({ ...updatedReminder, id: reminder.id })}
                              onCancel={() => setEditingReminder(null)}
                            />
                          </div>
                        ) : (
                          <ReminderItem
                            reminder={reminder}
                            onEdit={() => setEditingReminder(reminder.id)}
                            onDelete={deleteReminder}
                          />
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

interface CaseFormProps {
  initialData?: Case;
  onSubmit: (caseData: Omit<Case, 'id' | 'user_id'>) => void;
  onCancel?: () => void;
}

const CaseForm: React.FC<CaseFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [court, setCourt] = useState(initialData?.court || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 4000); // Auto-hide after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleGenerateNotes = async () => {
    if (!title || title.trim() === '') {
      setErrorMessage("Please enter a valid case title.");
      return;
    }
    if (!court || court.trim() === '') {
      setErrorMessage("Please enter a valid court name.");
      return;
    }
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const generatedNotes = await generateNotes(title, court);
      setNotes(generatedNotes);
    } catch (error) {
      console.error("Failed to generate notes:", error);
      setErrorMessage("Please check and enter valid info in the form.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      court,
      date,
      notes,
    });
    if (!initialData) {
      setTitle('');
      setCourt('');
      setDate('');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="block mb-2 text-sm font-bold text-gray-800">
            Case Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter case title"
            className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
            required
          />
        </div>
        <div>
          <label htmlFor="court" className="block mb-2 text-sm font-bold text-gray-800">
            Court *
          </label>
          <input
            id="court"
            type="text"
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            placeholder="Enter court name"
            className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
            required
          />
        </div>
      </div>
      <div>
        <label htmlFor="date" className="block mb-2 text-sm font-bold text-gray-800">
          Date *
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
          required
        />
      </div>
      <div>
        <label htmlFor="notes" className="block mb-2 text-sm font-bold text-gray-800">
          Case Notes
        </label>
        <div className="relative">
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about the case..."
            className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium resize-none"
            rows={6}
          />
          <motion.button
            type="button"
            onClick={handleGenerateNotes}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isGenerating}
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-primary/80 text-white disabled:bg-gray-400"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <LuSparkles className="w-5 h-5" />
            )}
          </motion.button>
          {errorMessage && (
            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <p className="text-red-700 text-sm">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end pt-6 space-x-4">
        {onCancel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 transition-all hover:bg-white/80 font-semibold"
          >
            Cancel
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="px-8 py-3 text-white rounded-xl shadow-lg transition-all bg-gradient-to-r from-primary to-primary-dark hover:shadow-xl font-semibold"
        >
          {initialData ? 'Update Case' : 'Add Case'}
        </motion.button>
      </div>
    </form>
  );
};

interface CaseItemProps {
  case_: Case;
  isSelected: boolean;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onClick: () => void;
}

const CaseItem: React.FC<CaseItemProps> = ({ case_, isSelected, onEdit, onDelete, onClick }) => {

  return (
    <div className="p-6 cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-3 space-x-3">
            <h3 className="text-lg font-bold text-gray-900 truncate">{case_.title}</h3>
          </div>

          <div className="flex items-center mb-3 space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Building className="mr-2 w-4 h-4" />
              <span className="font-medium">{case_.court}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 w-4 h-4" />
              <span className="font-medium">Date: {formatDate(case_.date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center ml-4 space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-3 rounded-xl transition-all hover:bg-white/60 backdrop-blur-sm"
            title="Edit case"
          >
            <Edit className="w-5 h-5 text-blue-500" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              if (case_.id) onDelete(case_.id);
            }}
            className="p-3 rounded-xl transition-all hover:bg-white/60 backdrop-blur-sm"
            title="Delete case"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isSelected && case_.notes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 mt-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 shadow-lg backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-bold text-gray-800">Case Notes:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">{case_.notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Updated ReminderForm component with better styling
interface ReminderFormProps {
  initialData?: Partial<Reminder>;
  onSubmit: (reminderData: Omit<Reminder, 'id'>) => void;
  onCancel?: () => void;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [time, setTime] = useState(initialData?.time || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      date,
      time,
      priority,
    });
    if (!initialData) {
      setTitle('');
      setDate('');
      setTime('');
      setPriority('medium');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="reminderTitle" className="block mb-2 text-sm font-bold text-gray-800">
          Reminder Title *
        </label>
        <input
          id="reminderTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter reminder title"
          className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-medium"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="reminderDate" className="block mb-2 text-sm font-bold text-gray-800">
            Date *
          </label>
          <input
            id="reminderDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-medium"
            required
          />
        </div>
        <div>
          <label htmlFor="reminderTime" className="block mb-2 text-sm font-bold text-gray-800">
            Time *
          </label>
          <input
            id="reminderTime"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-medium"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="reminderPriority" className="block mb-2 text-sm font-bold text-gray-800">
          Priority
        </label>
        <select
          id="reminderPriority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="px-4 py-3 w-full rounded-xl bg-white/60 border border-white/40 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all font-medium"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="flex justify-end pt-6 space-x-4">
        {onCancel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 transition-all hover:bg-white/80 font-semibold"
          >
            Cancel
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="px-8 py-3 text-white rounded-xl shadow-lg transition-all bg-gradient-to-r from-secondary to-primary hover:shadow-xl font-semibold"
        >
          {initialData ? 'Update Reminder' : 'Add Reminder'}
        </motion.button>
      </div>
    </form>
  );
};

// Updated ReminderItem component with better styling
interface ReminderItemProps {
  reminder: Reminder;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onEdit, onDelete }) => {
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const isOverdue = new Date(reminder.date) < new Date();

  return (
    <div className={`p-6 transition-all ${isOverdue ? 'bg-gradient-to-br from-red-50/60 to-red-100/40' : ''} backdrop-blur-sm`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-3 space-x-3">
            <h3 className="text-lg font-bold text-gray-900 truncate">{reminder.title}</h3>
            <span className={`px-3 py-1 text-xs font-bold rounded-xl border ${getPriorityColor(reminder.priority)}`}>
              {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
            </span>
            {isOverdue && (
              <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-xl border border-red-200">
                Overdue
              </span>
            )}
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 w-4 h-4" />
              <span className="font-medium">{formatDate(reminder.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 w-4 h-4" />
              <span className="font-medium">{reminder.time}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center ml-4 space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-3 rounded-xl transition-all hover:bg-white/60 backdrop-blur-sm"
            title="Edit reminder"
          >
            <Edit className="w-5 h-5 text-blue-500" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(reminder.id);
            }}
            className="p-3 rounded-xl transition-all hover:bg-white/60 backdrop-blur-sm"
            title="Delete reminder"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AdvocateDiary;
