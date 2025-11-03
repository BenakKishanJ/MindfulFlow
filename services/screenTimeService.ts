import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ScreenTimeData, ScreenSession, ScreenTimeStats, ScreenTimeLimits } from '../types/screenTime';

const STORAGE_KEYS = {
  CURRENT_SESSION: 'current_session',
  TODAY_DATA: 'today_screen_data',
  LIMITS: 'screen_time_limits',
};

class ScreenTimeService {
  private currentSession: ScreenSession | null = null;
  private sessionStartTime: Date | null = null;
  private listeners: ((data: ScreenTimeData) => void)[] = [];

  // Initialize service
  async initialize(userId: string): Promise<void> {
    await this.loadCurrentSession();
    await this.loadTodayData(userId);
    this.startBackgroundTracking();
  }

  // Start a new screen session
  async startSession(appName?: string): Promise<void> {
    this.sessionStartTime = new Date();
    this.currentSession = {
      id: `session_${Date.now()}`,
      startTime: this.sessionStartTime,
      duration: 0,
      appUsed: appName,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(this.currentSession));
  }

  // End current session
  async endSession(): Promise<void> {
    if (!this.currentSession || !this.sessionStartTime) return;

    const endTime = new Date();
    const duration = (endTime.getTime() - this.sessionStartTime.getTime()) / (1000 * 60); // minutes

    this.currentSession.endTime = endTime;
    this.currentSession.duration = duration;

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(this.currentSession));

    // Reset current session
    this.currentSession = null;
    this.sessionStartTime = null;
  }

  // Get today's screen time data
  async getTodayData(userId: string): Promise<ScreenTimeData> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Try to get from Firestore first
      const docRef = doc(db, 'users', userId, 'screenTime', today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as ScreenTimeData;
      }
    } catch (error) {
      console.error('Error fetching from Firestore:', error);
    }

    // Fallback to local storage
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.TODAY_DATA);
    if (stored) {
      return JSON.parse(stored);
    }

    // Return default data
    return {
      date: today,
      totalScreenTime: 0,
      appUsage: [],
      peakHours: [],
      sessions: [],
      wellnessScore: 100,
    };
  }

  // Update today's data
  async updateTodayData(userId: string, data: Partial<ScreenTimeData>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const currentData = await this.getTodayData(userId);

    const updatedData: ScreenTimeData = {
      ...currentData,
      ...data,
      date: today,
    };

    // Save to local storage
    await AsyncStorage.setItem(STORAGE_KEYS.TODAY_DATA, JSON.stringify(updatedData));

    // Save to Firestore
    try {
      const docRef = doc(db, 'users', userId, 'screenTime', today);
      await setDoc(docRef, updatedData);
    } catch (error) {
      console.error('Error saving to Firestore:', error);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(updatedData));
  }

  // Get screen time statistics
  async getStats(userId: string): Promise<ScreenTimeStats> {
    const todayData = await this.getTodayData(userId);

    // Get last 7 days data for weekly stats
    const weeklyData = await this.getWeeklyData(userId, 7);
    const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.totalScreenTime, 0);
    const weeklyAverage = weeklyTotal / weeklyData.length;

    // Calculate most used app
    const appUsage = todayData.appUsage.reduce((acc, app) => {
      acc[app.appName] = (acc[app.appName] || 0) + app.totalTime;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedApp = Object.entries(appUsage).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    // Calculate peak hour (simplified - just current hour for now)
    const currentHour = new Date().getHours();

    return {
      today: todayData,
      weeklyAverage,
      weeklyTotal,
      streakDays: 0, // TODO: Implement streak calculation
      longestStreak: 0, // TODO: Implement streak calculation
      mostUsedApp,
      mostUsedHour: currentHour,
    };
  }

  // Get weekly data
  private async getWeeklyData(userId: string, days: number): Promise<ScreenTimeData[]> {
    const data: ScreenTimeData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      try {
        const docRef = doc(db, 'users', userId, 'screenTime', dateStr);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          data.push(docSnap.data() as ScreenTimeData);
        } else {
          // Add default data for missing days
          data.push({
            date: dateStr,
            totalScreenTime: 0,
            appUsage: [],
            peakHours: [],
            sessions: [],
            wellnessScore: 100,
          });
        }
      } catch (error) {
        console.error(`Error fetching data for ${dateStr}:`, error);
      }
    }

    return data;
  }

  // Get screen time limits
  async getLimits(): Promise<ScreenTimeLimits> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LIMITS);
    if (stored) {
      return JSON.parse(stored);
    }

    // Default limits
    return {
      dailyLimit: 480, // 8 hours
      breakInterval: 30, // 30 minutes
      warningThreshold: 80, // 80%
      autoBlockEnabled: false,
      eyeCareModeEnabled: false,
    };
  }

  // Update screen time limits
  async updateLimits(limits: Partial<ScreenTimeLimits>): Promise<void> {
    const currentLimits = await this.getLimits();
    const updatedLimits = { ...currentLimits, ...limits };
    await AsyncStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(updatedLimits));
  }

  // Add listener for real-time updates
  addListener(callback: (data: ScreenTimeData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Background tracking (simplified for now)
  private startBackgroundTracking(): void {
    // In a real implementation, this would use background tasks
    // For now, we'll track when the app is active
    setInterval(async () => {
      if (this.currentSession && this.sessionStartTime) {
        const now = new Date();
        const duration = (now.getTime() - this.sessionStartTime.getTime()) / (1000 * 60);
        this.currentSession.duration = duration;
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(this.currentSession));
      }
    }, 60000); // Update every minute
  }

  // Load current session from storage
  private async loadCurrentSession(): Promise<void> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (stored) {
      this.currentSession = JSON.parse(stored);
      if (this.currentSession && !this.currentSession.endTime) {
        this.sessionStartTime = new Date(this.currentSession.startTime);
      }
    }
  }

  // Load today's data from storage
  private async loadTodayData(userId: string): Promise<void> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.TODAY_DATA);
    if (stored) {
      const data = JSON.parse(stored);
      // Sync with Firestore if needed
      await this.updateTodayData(userId, data);
    }
  }

  // Clean up old data (keep last 30 days)
  async cleanupOldData(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const screenTimeRef = collection(db, 'users', userId, 'screenTime');
      const q = query(screenTimeRef, where('date', '<', thirtyDaysAgo.toISOString().split('T')[0]));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (doc) => {
        await setDoc(doc.ref, {}); // This would delete in a real implementation
      });
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}

export const screenTimeService = new ScreenTimeService();