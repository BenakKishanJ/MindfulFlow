export interface AppUsage {
  appName: string;
  packageName: string;
  totalTime: number; // minutes
  lastUsed: Date;
  category?: string;
}

export interface ScreenTimeData {
  date: string;
  totalScreenTime: number; // minutes
  appUsage: AppUsage[];
  peakHours: number[]; // hours 0-23 with highest usage
  sessions: ScreenSession[];
  wellnessScore: number;
}

export interface ScreenSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  appUsed?: string;
  wellnessMetrics?: {
    blinkRate?: number;
    postureScore?: number;
    breaksTaken?: number;
  };
}

export interface ScreenTimeLimits {
  dailyLimit: number; // minutes
  breakInterval: number; // minutes
  warningThreshold: number; // percentage of daily limit
  autoBlockEnabled: boolean;
  eyeCareModeEnabled: boolean;
}

export interface ScreenTimeStats {
  today: ScreenTimeData;
  weeklyAverage: number;
  weeklyTotal: number;
  streakDays: number;
  longestStreak: number;
  mostUsedApp: string;
  mostUsedHour: number;
}