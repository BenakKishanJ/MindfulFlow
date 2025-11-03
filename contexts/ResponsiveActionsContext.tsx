import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { responsiveActionsService } from '../services/responsiveActionsService';
import { ResponsiveAction, ActionType, ActionTrigger, AppBlockConfig, EyeCareConfig, GreyscaleConfig, BreakReminderConfig } from '../types/responsiveActions';

interface ResponsiveActionsContextType {
  // Actions
  activeActions: ResponsiveAction[];
  createAction: (type: ActionType, trigger: ActionTrigger, duration?: number) => Promise<ResponsiveAction>;
  activateAction: (actionId: string) => Promise<void>;
  deactivateAction: (actionId: string) => Promise<void>;

  // Configurations
  appBlockConfig: AppBlockConfig | null;
  eyeCareConfig: EyeCareConfig | null;
  greyscaleConfig: GreyscaleConfig | null;
  breakReminderConfig: BreakReminderConfig | null;

  updateAppBlockConfig: (config: Partial<AppBlockConfig>) => Promise<void>;
  updateEyeCareConfig: (config: Partial<EyeCareConfig>) => Promise<void>;
  updateGreyscaleConfig: (config: Partial<GreyscaleConfig>) => Promise<void>;
  updateBreakReminderConfig: (config: Partial<BreakReminderConfig>) => Promise<void>;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const ResponsiveActionsContext = createContext<ResponsiveActionsContextType | null>(null);

export const useResponsiveActions = () => {
  const context = useContext(ResponsiveActionsContext);
  if (!context) {
    throw new Error('useResponsiveActions must be used within a ResponsiveActionsProvider');
  }
  return context;
};

interface ResponsiveActionsProviderProps {
  children: ReactNode;
}

export const ResponsiveActionsProvider: React.FC<ResponsiveActionsProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeActions, setActiveActions] = useState<ResponsiveAction[]>([]);
  const [appBlockConfig, setAppBlockConfig] = useState<AppBlockConfig | null>(null);
  const [eyeCareConfig, setEyeCareConfig] = useState<EyeCareConfig | null>(null);
  const [greyscaleConfig, setGreyscaleConfig] = useState<GreyscaleConfig | null>(null);
  const [breakReminderConfig, setBreakReminderConfig] = useState<BreakReminderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize service when user is available
  useEffect(() => {
    if (currentUser?.uid) {
      initializeActions(currentUser.uid);
    }
  }, [currentUser?.uid]);

  const initializeActions = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize service
      await responsiveActionsService.initialize(userId);

      // Load configurations
      await loadConfigurations();

      // Set up listener for active actions
      const unsubscribe = responsiveActionsService.addListener((actions) => {
        setActiveActions(actions);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Error initializing responsive actions:', err);
      setError('Failed to initialize responsive actions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfigurations = async () => {
    try {
      const [appBlock, eyeCare, greyscale, breakReminder] = await Promise.all([
        responsiveActionsService.getAppBlockConfig(),
        responsiveActionsService.getEyeCareConfig(),
        responsiveActionsService.getGreyscaleConfig(),
        responsiveActionsService.getBreakReminderConfig(),
      ]);

      setAppBlockConfig(appBlock);
      setEyeCareConfig(eyeCare);
      setGreyscaleConfig(greyscale);
      setBreakReminderConfig(breakReminder);
    } catch (err) {
      console.error('Error loading configurations:', err);
    }
  };

  const createAction = async (type: ActionType, trigger: ActionTrigger, duration?: number): Promise<ResponsiveAction> => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      return await responsiveActionsService.createAction(currentUser.uid, type, trigger, duration);
    } catch (err) {
      console.error('Error creating action:', err);
      setError('Failed to create action');
      throw err;
    }
  };

  const activateAction = async (actionId: string): Promise<void> => {
    if (!currentUser?.uid) return;

    try {
      await responsiveActionsService.activateAction(currentUser.uid, actionId);
    } catch (err) {
      console.error('Error activating action:', err);
      setError('Failed to activate action');
    }
  };

  const deactivateAction = async (actionId: string): Promise<void> => {
    if (!currentUser?.uid) return;

    try {
      await responsiveActionsService.deactivateAction(currentUser.uid, actionId);
    } catch (err) {
      console.error('Error deactivating action:', err);
      setError('Failed to deactivate action');
    }
  };

  const updateAppBlockConfig = async (config: Partial<AppBlockConfig>): Promise<void> => {
    try {
      await responsiveActionsService.updateAppBlockConfig(config);
      const updated = await responsiveActionsService.getAppBlockConfig();
      setAppBlockConfig(updated);
    } catch (err) {
      console.error('Error updating app block config:', err);
      setError('Failed to update app block configuration');
    }
  };

  const updateEyeCareConfig = async (config: Partial<EyeCareConfig>): Promise<void> => {
    try {
      await responsiveActionsService.updateEyeCareConfig(config);
      const updated = await responsiveActionsService.getEyeCareConfig();
      setEyeCareConfig(updated);
    } catch (err) {
      console.error('Error updating eye care config:', err);
      setError('Failed to update eye care configuration');
    }
  };

  const updateGreyscaleConfig = async (config: Partial<GreyscaleConfig>): Promise<void> => {
    try {
      await responsiveActionsService.updateGreyscaleConfig(config);
      const updated = await responsiveActionsService.getGreyscaleConfig();
      setGreyscaleConfig(updated);
    } catch (err) {
      console.error('Error updating greyscale config:', err);
      setError('Failed to update greyscale configuration');
    }
  };

  const updateBreakReminderConfig = async (config: Partial<BreakReminderConfig>): Promise<void> => {
    try {
      await responsiveActionsService.updateBreakReminderConfig(config);
      const updated = await responsiveActionsService.getBreakReminderConfig();
      setBreakReminderConfig(updated);
    } catch (err) {
      console.error('Error updating break reminder config:', err);
      setError('Failed to update break reminder configuration');
    }
  };

  const value: ResponsiveActionsContextType = {
    activeActions,
    createAction,
    activateAction,
    deactivateAction,
    appBlockConfig,
    eyeCareConfig,
    greyscaleConfig,
    breakReminderConfig,
    updateAppBlockConfig,
    updateEyeCareConfig,
    updateGreyscaleConfig,
    updateBreakReminderConfig,
    isLoading,
    error,
  };

  return (
    <ResponsiveActionsContext.Provider value={value}>
      {children}
    </ResponsiveActionsContext.Provider>
  );
};