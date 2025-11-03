import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  ResponsiveAction,
  ActionType,
  ActionTrigger,
  ActionLog,
  AppBlockConfig,
  EyeCareConfig,
  GreyscaleConfig,
  BreakReminderConfig
} from '../types/responsiveActions';

const STORAGE_KEYS = {
  ACTIVE_ACTIONS: 'active_actions',
  ACTION_LOGS: 'action_logs',
  APP_BLOCK_CONFIG: 'app_block_config',
  EYE_CARE_CONFIG: 'eye_care_config',
  GREYSCALE_CONFIG: 'greyscale_config',
  BREAK_REMINDER_CONFIG: 'break_reminder_config',
};

class ResponsiveActionsService {
  private activeActions: ResponsiveAction[] = [];
  private actionListeners: ((actions: ResponsiveAction[]) => void)[] = [];

  // Initialize service
  async initialize(userId: string): Promise<void> {
    await this.loadActiveActions();
    this.startActionMonitoring(userId);
  }

  // Create a new responsive action
  async createAction(
    userId: string,
    type: ActionType,
    trigger: ActionTrigger,
    duration?: number
  ): Promise<ResponsiveAction> {
    const action: ResponsiveAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      title: this.getActionTitle(type),
      description: this.getActionDescription(type),
      isActive: false,
      triggerCondition: trigger,
      duration,
      createdAt: new Date(),
    };

    // Save to Firestore
    try {
      const docRef = doc(db, 'users', userId, 'actions', action.id);
      await setDoc(docRef, action);
    } catch (error) {
      console.error('Error saving action to Firestore:', error);
    }

    return action;
  }

  // Activate an action
  async activateAction(userId: string, actionId: string): Promise<void> {
    const action = this.activeActions.find(a => a.id === actionId);
    if (!action) return;

    action.isActive = true;
    action.activatedAt = new Date();

    // Update in Firestore
    try {
      const docRef = doc(db, 'users', userId, 'actions', actionId);
      await updateDoc(docRef, {
        isActive: true,
        activatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error activating action:', error);
    }

    // Log the activation
    await this.logAction(userId, actionId, action.type);

    // Apply the action
    await this.applyAction(action);

    // Notify listeners
    this.notifyListeners();

    // Set up auto-deactivation if duration is specified
    if (action.duration) {
      setTimeout(async () => {
        await this.deactivateAction(userId, actionId);
      }, action.duration * 60 * 1000); // Convert minutes to milliseconds
    }
  }

  // Deactivate an action
  async deactivateAction(userId: string, actionId: string): Promise<void> {
    const action = this.activeActions.find(a => a.id === actionId);
    if (!action) return;

    action.isActive = false;

    // Update in Firestore
    try {
      const docRef = doc(db, 'users', userId, 'actions', actionId);
      await updateDoc(docRef, { isActive: false });
    } catch (error) {
      console.error('Error deactivating action:', error);
    }

    // Remove the action
    await this.removeAction(action);

    // Notify listeners
    this.notifyListeners();
  }

  // Check if actions should be triggered based on screen time data
  async checkTriggers(userId: string, screenTimeMinutes: number, breakIntervalMinutes: number): Promise<void> {
    // Check screen time limit triggers
    const screenTimeActions = this.activeActions.filter(
      action => action.triggerCondition.type === 'screen_time_limit' && !action.isActive
    );

    for (const action of screenTimeActions) {
      if (screenTimeMinutes >= action.triggerCondition.threshold) {
        await this.activateAction(userId, action.id);
      }
    }

    // Check break interval triggers
    const breakActions = this.activeActions.filter(
      action => action.triggerCondition.type === 'break_interval' && !action.isActive
    );

    for (const action of breakActions) {
      if (breakIntervalMinutes >= action.triggerCondition.threshold) {
        await this.activateAction(userId, action.id);
        // Reset break timer logic would go here
      }
    }
  }

  // Get all active actions
  getActiveActions(): ResponsiveAction[] {
    return this.activeActions.filter(action => action.isActive);
  }

  // Get action configuration
  async getAppBlockConfig(): Promise<AppBlockConfig> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.APP_BLOCK_CONFIG);
    return stored ? JSON.parse(stored) : {
      blockedApps: [],
      blockDuration: 15,
      allowEmergencyAccess: true,
      emergencyCode: '1234',
    };
  }

  async getEyeCareConfig(): Promise<EyeCareConfig> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.EYE_CARE_CONFIG);
    return stored ? JSON.parse(stored) : {
      blueLightFilter: false,
      brightnessLevel: 0.8,
      colorTemperature: 6500,
      autoAdjust: false,
    };
  }

  async getGreyscaleConfig(): Promise<GreyscaleConfig> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.GREYSCALE_CONFIG);
    return stored ? JSON.parse(stored) : {
      intensity: 0.5,
      gradualTransition: true,
      transitionDuration: 2,
    };
  }

  async getBreakReminderConfig(): Promise<BreakReminderConfig> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.BREAK_REMINDER_CONFIG);
    return stored ? JSON.parse(stored) : {
      interval: 30,
      duration: 30,
      soundEnabled: true,
      vibrationEnabled: true,
      message: 'Time for a break! Look at something 20 feet away for 20 seconds.',
    };
  }

  // Update configurations
  async updateAppBlockConfig(config: Partial<AppBlockConfig>): Promise<void> {
    const current = await this.getAppBlockConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(STORAGE_KEYS.APP_BLOCK_CONFIG, JSON.stringify(updated));
  }

  async updateEyeCareConfig(config: Partial<EyeCareConfig>): Promise<void> {
    const current = await this.getEyeCareConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(STORAGE_KEYS.EYE_CARE_CONFIG, JSON.stringify(updated));
  }

  async updateGreyscaleConfig(config: Partial<GreyscaleConfig>): Promise<void> {
    const current = await this.getGreyscaleConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(STORAGE_KEYS.GREYSCALE_CONFIG, JSON.stringify(updated));
  }

  async updateBreakReminderConfig(config: Partial<BreakReminderConfig>): Promise<void> {
    const current = await this.getBreakReminderConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(STORAGE_KEYS.BREAK_REMINDER_CONFIG, JSON.stringify(updated));
  }

  // Add listener for action updates
  addListener(callback: (actions: ResponsiveAction[]) => void): () => void {
    this.actionListeners.push(callback);
    return () => {
      this.actionListeners = this.actionListeners.filter(listener => listener !== callback);
    };
  }

  // Private methods
  private getActionTitle(type: ActionType): string {
    const titles = {
      app_block: 'App Blocking',
      greyscale_mode: 'Greyscale Mode',
      eye_care_mode: 'Eye Care Mode',
      brightness_adjust: 'Brightness Adjustment',
      break_reminder: 'Break Reminder',
    };
    return titles[type] || 'Unknown Action';
  }

  private getActionDescription(type: ActionType): string {
    const descriptions = {
      app_block: 'Blocks distracting apps to encourage breaks',
      greyscale_mode: 'Converts screen to greyscale to reduce visual stimulation',
      eye_care_mode: 'Applies blue light filter and adjusts brightness for eye comfort',
      brightness_adjust: 'Automatically adjusts screen brightness for eye protection',
      break_reminder: 'Shows reminders to take regular breaks',
    };
    return descriptions[type] || 'Responsive wellness action';
  }

  private async applyAction(action: ResponsiveAction): Promise<void> {
    switch (action.type) {
      case 'app_block':
        await this.applyAppBlock();
        break;
      case 'greyscale_mode':
        await this.applyGreyscaleMode();
        break;
      case 'eye_care_mode':
        await this.applyEyeCareMode();
        break;
      case 'brightness_adjust':
        await this.applyBrightnessAdjust();
        break;
      case 'break_reminder':
        await this.showBreakReminder();
        break;
    }
  }

  private async removeAction(action: ResponsiveAction): Promise<void> {
    switch (action.type) {
      case 'app_block':
        await this.removeAppBlock();
        break;
      case 'greyscale_mode':
        await this.removeGreyscaleMode();
        break;
      case 'eye_care_mode':
        await this.removeEyeCareMode();
        break;
      case 'brightness_adjust':
        await this.removeBrightnessAdjust();
        break;
    }
  }

  private async applyAppBlock(): Promise<void> {
    // Implementation would integrate with device app blocking APIs
    console.log('Applying app block');
  }

  private async removeAppBlock(): Promise<void> {
    console.log('Removing app block');
  }

  private async applyGreyscaleMode(): Promise<void> {
    // Implementation would apply greyscale filter to the app
    console.log('Applying greyscale mode');
  }

  private async removeGreyscaleMode(): Promise<void> {
    console.log('Removing greyscale mode');
  }

  private async applyEyeCareMode(): Promise<void> {
    // Implementation would apply blue light filter and brightness adjustment
    console.log('Applying eye care mode');
  }

  private async removeEyeCareMode(): Promise<void> {
    console.log('Removing eye care mode');
  }

  private async applyBrightnessAdjust(): Promise<void> {
    // Implementation would adjust device brightness
    console.log('Applying brightness adjustment');
  }

  private async removeBrightnessAdjust(): Promise<void> {
    console.log('Removing brightness adjustment');
  }

  private async showBreakReminder(): Promise<void> {
    // Implementation would show break reminder notification
    console.log('Showing break reminder');
  }

  private async logAction(userId: string, actionId: string, actionType: ActionType): Promise<void> {
    const log: ActionLog = {
      id: `log_${Date.now()}`,
      actionId,
      actionType,
      triggeredAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'users', userId, 'actionLogs'), log);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  private async loadActiveActions(): Promise<void> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_ACTIONS);
    if (stored) {
      this.activeActions = JSON.parse(stored);
    }
  }

  private startActionMonitoring(userId: string): void {
    // Monitor screen time and trigger actions
    // This would integrate with the screen time service
    setInterval(async () => {
      // Check triggers periodically
      // Implementation would get current screen time from screenTimeService
    }, 60000); // Check every minute
  }

  private notifyListeners(): void {
    const activeActions = this.getActiveActions();
    this.actionListeners.forEach(listener => listener(activeActions));
  }
}

export const responsiveActionsService = new ResponsiveActionsService();