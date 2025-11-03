export type ActionType = 'app_block' | 'greyscale_mode' | 'eye_care_mode' | 'brightness_adjust' | 'break_reminder';

export interface ResponsiveAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  isActive: boolean;
  triggerCondition: ActionTrigger;
  duration?: number; // minutes, for temporary actions
  createdAt: Date;
  activatedAt?: Date;
}

export interface ActionTrigger {
  type: 'screen_time_limit' | 'break_interval' | 'eye_strain_threshold' | 'posture_threshold' | 'manual';
  threshold: number; // minutes for time-based, percentage for others
  recurring: boolean; // true for recurring actions like break reminders
}

export interface ActionLog {
  id: string;
  actionId: string;
  actionType: ActionType;
  triggeredAt: Date;
  duration?: number; // how long the action was active
  userResponse?: 'dismissed' | 'completed' | 'ignored';
  effectiveness?: number; // 1-5 rating of how effective the action was
}

export interface AppBlockConfig {
  blockedApps: string[];
  blockDuration: number; // minutes
  allowEmergencyAccess: boolean;
  emergencyCode?: string;
}

export interface EyeCareConfig {
  blueLightFilter: boolean;
  brightnessLevel: number; // 0-1
  colorTemperature: number; // Kelvin
  autoAdjust: boolean;
}

export interface GreyscaleConfig {
  intensity: number; // 0-1, 1 = full greyscale
  gradualTransition: boolean;
  transitionDuration: number; // seconds
}

export interface BreakReminderConfig {
  interval: number; // minutes
  duration: number; // seconds to show reminder
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  message: string;
}