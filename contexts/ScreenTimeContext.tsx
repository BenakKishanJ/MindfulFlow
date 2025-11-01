import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { screenTimeService } from '../services/screenTimeService';
import { ScreenTimeData, ScreenTimeStats, ScreenTimeLimits } from '../types/screenTime';

interface ScreenTimeContextType {
  // Data
  todayData: ScreenTimeData | null;
  stats: ScreenTimeStats | null;
  limits: ScreenTimeLimits | null;

  // Actions
  startSession: (appName?: string) => Promise<void>;
  endSession: () => Promise<void>;
  updateLimits: (limits: Partial<ScreenTimeLimits>) => Promise<void>;
  refreshData: () => Promise<void>;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const ScreenTimeContext = createContext<ScreenTimeContextType | null>(null);

export const useScreenTime = () => {
  const context = useContext(ScreenTimeContext);
  if (!context) {
    throw new Error('useScreenTime must be used within a ScreenTimeProvider');
  }
  return context;
};

interface ScreenTimeProviderProps {
  children: ReactNode;
}

export const ScreenTimeProvider: React.FC<ScreenTimeProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [todayData, setTodayData] = useState<ScreenTimeData | null>(null);
  const [stats, setStats] = useState<ScreenTimeStats | null>(null);
  const [limits, setLimits] = useState<ScreenTimeLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize screen time service when user is available
  useEffect(() => {
    if (currentUser?.uid) {
      initializeScreenTime(currentUser.uid);
    }
  }, [currentUser?.uid]);

  const initializeScreenTime = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize service
      await screenTimeService.initialize(userId);

      // Load initial data
      await refreshData();

      // Set up real-time listener
      const unsubscribe = screenTimeService.addListener((data) => {
        setTodayData(data);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Error initializing screen time:', err);
      setError('Failed to initialize screen time tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (!currentUser?.uid) return;

    try {
      const [todayDataResult, statsResult, limitsResult] = await Promise.all([
        screenTimeService.getTodayData(currentUser.uid),
        screenTimeService.getStats(currentUser.uid),
        screenTimeService.getLimits(),
      ]);

      setTodayData(todayDataResult);
      setStats(statsResult);
      setLimits(limitsResult);
    } catch (err) {
      console.error('Error refreshing screen time data:', err);
      setError('Failed to refresh data');
    }
  };

  const startSession = async (appName?: string) => {
    try {
      await screenTimeService.startSession(appName);
      await refreshData();
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session');
    }
  };

  const endSession = async () => {
    try {
      await screenTimeService.endSession();
      await refreshData();
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
    }
  };

  const updateLimits = async (newLimits: Partial<ScreenTimeLimits>) => {
    try {
      await screenTimeService.updateLimits(newLimits);
      const updatedLimits = await screenTimeService.getLimits();
      setLimits(updatedLimits);
    } catch (err) {
      console.error('Error updating limits:', err);
      setError('Failed to update limits');
    }
  };

  const value: ScreenTimeContextType = {
    todayData,
    stats,
    limits,
    startSession,
    endSession,
    updateLimits,
    refreshData,
    isLoading,
    error,
  };

  return (
    <ScreenTimeContext.Provider value={value}>
      {children}
    </ScreenTimeContext.Provider>
  );
};