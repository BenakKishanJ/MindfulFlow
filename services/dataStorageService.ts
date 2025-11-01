import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ScreenTimeData, ScreenSession } from '../types/screenTime';
import { ExerciseSession } from '../types/exercises';

export interface WellnessMetrics {
  eyeStrainLevel: number; // 0-10
  blinkRate: number; // blinks per minute
  postureScore: number; // 0-100
  stressLevel: number; // 0-10
  focusLevel: number; // 0-10
}

export interface DailyWellnessData {
  date: string;
  userId: string;

  // Screen time data
  screenTime: {
    totalMinutes: number;
    appUsage: Record<string, number>; // app name -> minutes
    peakHours: number[];
    sessions: ScreenSession[];
  };

  // Wellness metrics
  wellnessMetrics: {
    averageEyeStrain: number;
    averageBlinkRate: number;
    averagePostureScore: number;
    averageStressLevel: number;
    averageFocusLevel: number;
    wellnessScore: number; // 0-100
  };

  // Exercise data
  exercises: {
    completed: ExerciseSession[];
    totalTime: number; // minutes
    categories: Record<string, number>; // category -> count
  };

  // Environmental factors
  environment: {
    lighting?: 'poor' | 'adequate' | 'good';
    noise?: 'quiet' | 'moderate' | 'loud';
    temperature?: 'cold' | 'comfortable' | 'warm';
  };

  // User feedback
  feedback?: {
    mood: 'poor' | 'fair' | 'good' | 'excellent';
    energy: 'low' | 'moderate' | 'high';
    productivity: 'low' | 'moderate' | 'high';
    notes?: string;
  };

  // AI insights
  aiInsights?: {
    generated: boolean;
    summary?: string;
    recommendations?: string[];
    riskFactors?: string[];
    trends?: string[];
  };
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  userId: string;

  // Aggregated data
  summary: {
    totalScreenTime: number;
    averageWellnessScore: number;
    exercisesCompleted: number;
    bestDay: string;
    worstDay: string;
  };

  // Trends
  trends: {
    screenTimeChange: number; // percentage
    wellnessScoreChange: number;
    exerciseFrequencyChange: number;
    eyeStrainChange: number;
  };

  // AI analysis
  aiAnalysis: {
    overallAssessment: string;
    keyInsights: string[];
    recommendations: string[];
    goals: string[];
    riskAlerts: string[];
  };

  // Generated timestamp
  generatedAt: Date;
}

class DataStorageService {
  private readonly STORAGE_KEYS = {
    DAILY_DATA: 'daily_wellness_data',
    WEEKLY_REPORTS: 'weekly_reports',
    LAST_SYNC: 'last_sync_timestamp',
  };

  // Store daily wellness data
  async storeDailyData(userId: string, data: Omit<DailyWellnessData, 'userId'>): Promise<void> {
    const dailyData: DailyWellnessData = {
      ...data,
      userId,
    };

    try {
      // Store locally first
      await this.storeLocally(dailyData);

      // Store in Firestore
      const docRef = doc(db, 'users', userId, 'dailyData', data.date);
      await setDoc(docRef, {
        ...dailyData,
        date: Timestamp.fromDate(new Date(data.date)),
      });

      console.log('Daily data stored successfully');
    } catch (error) {
      console.error('Error storing daily data:', error);
      throw error;
    }
  }

  // Get daily wellness data
  async getDailyData(userId: string, date: string): Promise<DailyWellnessData | null> {
    try {
      // Try Firestore first
      const docRef = doc(db, 'users', userId, 'dailyData', date);
      const docSnap = await getDocs(query(collection(db, 'users', userId, 'dailyData'),
        where('date', '==', Timestamp.fromDate(new Date(date)))));

      if (!docSnap.empty) {
        const data = docSnap.docs[0].data() as any;
        return {
          ...data,
          date: data.date.toDate().toISOString().split('T')[0],
        };
      }

      // Fallback to local storage
      return await this.getLocalDailyData(date);
    } catch (error) {
      console.error('Error fetching daily data:', error);
      return await this.getLocalDailyData(date);
    }
  }

  // Get weekly data
  async getWeeklyData(userId: string, weekStart: string): Promise<DailyWellnessData[]> {
    const data: DailyWellnessData[] = [];
    const startDate = new Date(weekStart);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const dailyData = await this.getDailyData(userId, dateStr);
      if (dailyData) {
        data.push(dailyData);
      }
    }

    return data;
  }

  // Generate weekly report
  async generateWeeklyReport(userId: string, weekStart: string): Promise<WeeklyReport> {
    const weeklyData = await this.getWeeklyData(userId, weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Calculate summary statistics
    const totalScreenTime = weeklyData.reduce((sum, day) => sum + day.screenTime.totalMinutes, 0);
    const averageWellnessScore = weeklyData.length > 0
      ? weeklyData.reduce((sum, day) => sum + day.wellnessMetrics.wellnessScore, 0) / weeklyData.length
      : 0;
    const exercisesCompleted = weeklyData.reduce((sum, day) => sum + day.exercises.completed.length, 0);

    // Find best and worst days
    const sortedByWellness = [...weeklyData].sort((a, b) => b.wellnessMetrics.wellnessScore - a.wellnessMetrics.wellnessScore);
    const bestDay = sortedByWellness[0]?.date || weekStart;
    const worstDay = sortedByWellness[sortedByWellness.length - 1]?.date || weekStart;

    // Calculate trends (simplified - would need previous week data for real trends)
    const trends = {
      screenTimeChange: 0, // Would calculate from previous week
      wellnessScoreChange: 0,
      exerciseFrequencyChange: 0,
      eyeStrainChange: 0,
    };

    const report: WeeklyReport = {
      weekStart,
      weekEnd: weekEnd.toISOString().split('T')[0],
      userId,
      summary: {
        totalScreenTime,
        averageWellnessScore,
        exercisesCompleted,
        bestDay,
        worstDay,
      },
      trends,
      aiAnalysis: {
        overallAssessment: '',
        keyInsights: [],
        recommendations: [],
        goals: [],
        riskAlerts: [],
      },
      generatedAt: new Date(),
    };

    // Store the report
    await this.storeWeeklyReport(userId, report);

    return report;
  }

  // Store weekly report
  async storeWeeklyReport(userId: string, report: WeeklyReport): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'weeklyReports', report.weekStart);
      await setDoc(docRef, {
        ...report,
        generatedAt: Timestamp.fromDate(report.generatedAt),
      });
    } catch (error) {
      console.error('Error storing weekly report:', error);
    }
  }

  // Update wellness metrics for today
  async updateWellnessMetrics(userId: string, metrics: Partial<WellnessMetrics>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const existingData = await this.getDailyData(userId, today);

    const existingMetrics = existingData?.wellnessMetrics || {
      averageEyeStrain: 0,
      averageBlinkRate: 15,
      averagePostureScore: 85,
      averageStressLevel: 3,
      averageFocusLevel: 7,
      wellnessScore: 85,
    };

    const updatedMetrics: WellnessMetrics = {
      eyeStrainLevel: metrics.eyeStrainLevel ?? existingMetrics.averageEyeStrain,
      blinkRate: metrics.blinkRate ?? existingMetrics.averageBlinkRate,
      postureScore: metrics.postureScore ?? existingMetrics.averagePostureScore,
      stressLevel: metrics.stressLevel ?? existingMetrics.averageStressLevel,
      focusLevel: metrics.focusLevel ?? existingMetrics.averageFocusLevel,
    };

    // Recalculate wellness score
    const wellnessScore = this.calculateWellnessScore(updatedMetrics);

    const dailyData: Omit<DailyWellnessData, 'userId'> = {
      date: today,
      screenTime: existingData?.screenTime || {
        totalMinutes: 0,
        appUsage: {},
        peakHours: [],
        sessions: [],
      },
      wellnessMetrics: {
        averageEyeStrain: updatedMetrics.eyeStrainLevel,
        averageBlinkRate: updatedMetrics.blinkRate,
        averagePostureScore: updatedMetrics.postureScore,
        averageStressLevel: updatedMetrics.stressLevel,
        averageFocusLevel: updatedMetrics.focusLevel,
        wellnessScore,
      },
      exercises: existingData?.exercises || {
        completed: [],
        totalTime: 0,
        categories: {},
      },
      environment: existingData?.environment || {},
      feedback: existingData?.feedback,
    };

    await this.storeDailyData(userId, dailyData);
  }

  // Add exercise session
  async addExerciseSession(userId: string, session: ExerciseSession): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const existingData = await this.getDailyData(userId, today);

    const exercises = existingData?.exercises || {
      completed: [],
      totalTime: 0,
      categories: {},
    };

    // Update exercise data
    exercises.completed.push(session);
    exercises.totalTime += Math.round(session.duration / 60); // Convert to minutes

    // Update categories
    const category = session.exerciseId.split('_')[0]; // Extract category from ID
    exercises.categories[category] = (exercises.categories[category] || 0) + 1;

    const dailyData: Omit<DailyWellnessData, 'userId'> = {
      date: today,
      screenTime: existingData?.screenTime || {
        totalMinutes: 0,
        appUsage: {},
        peakHours: [],
        sessions: [],
      },
      wellnessMetrics: existingData?.wellnessMetrics || {
        averageEyeStrain: 0,
        averageBlinkRate: 15,
        averagePostureScore: 85,
        averageStressLevel: 3,
        averageFocusLevel: 7,
        wellnessScore: 85,
      },
      exercises,
      environment: existingData?.environment || {},
      feedback: existingData?.feedback,
    };

    await this.storeDailyData(userId, dailyData);
  }

  // Update environment factors
  async updateEnvironment(userId: string, environment: Partial<DailyWellnessData['environment']>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const existingData = await this.getDailyData(userId, today);

    const dailyData: Omit<DailyWellnessData, 'userId'> = {
      date: today,
      screenTime: existingData?.screenTime || {
        totalMinutes: 0,
        appUsage: {},
        peakHours: [],
        sessions: [],
      },
      wellnessMetrics: existingData?.wellnessMetrics || {
        averageEyeStrain: 0,
        averageBlinkRate: 15,
        averagePostureScore: 85,
        averageStressLevel: 3,
        averageFocusLevel: 7,
        wellnessScore: 85,
      },
      exercises: existingData?.exercises || {
        completed: [],
        totalTime: 0,
        categories: {},
      },
      environment: {
        ...existingData?.environment,
        ...environment,
      },
      feedback: existingData?.feedback,
    };

    await this.storeDailyData(userId, dailyData);
  }

  // Update user feedback
  async updateFeedback(userId: string, feedback: Partial<DailyWellnessData['feedback']>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const existingData = await this.getDailyData(userId, today);

    const existingFeedback = existingData?.feedback;

    const updatedFeedback: DailyWellnessData['feedback'] = {
      mood: feedback?.mood ?? existingFeedback?.mood ?? 'good',
      energy: feedback?.energy ?? existingFeedback?.energy ?? 'moderate',
      productivity: feedback?.productivity ?? existingFeedback?.productivity ?? 'moderate',
      notes: feedback?.notes ?? existingFeedback?.notes,
    };

    const dailyData: Omit<DailyWellnessData, 'userId'> = {
      date: today,
      screenTime: existingData?.screenTime || {
        totalMinutes: 0,
        appUsage: {},
        peakHours: [],
        sessions: [],
      },
      wellnessMetrics: existingData?.wellnessMetrics || {
        averageEyeStrain: 0,
        averageBlinkRate: 15,
        averagePostureScore: 85,
        averageStressLevel: 3,
        averageFocusLevel: 7,
        wellnessScore: 85,
      },
      exercises: existingData?.exercises || {
        completed: [],
        totalTime: 0,
        categories: {},
      },
      environment: existingData?.environment || {},
      feedback: updatedFeedback,
    };

    await this.storeDailyData(userId, dailyData);
  }

  // Calculate wellness score based on metrics
  private calculateWellnessScore(metrics: WellnessMetrics): number {
    // Weighted calculation
    const eyeStrainScore = Math.max(0, 100 - (metrics.eyeStrainLevel * 10));
    const blinkRateScore = metrics.blinkRate >= 15 ? 100 : Math.max(0, metrics.blinkRate * 6.67);
    const postureScore = metrics.postureScore;
    const stressScore = Math.max(0, 100 - (metrics.stressLevel * 10));
    const focusScore = metrics.focusLevel * 10;

    // Weighted average
    const score = (
      eyeStrainScore * 0.25 +
      blinkRateScore * 0.20 +
      postureScore * 0.25 +
      stressScore * 0.15 +
      focusScore * 0.15
    );

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  // Local storage helpers
  private async storeLocally(data: DailyWellnessData): Promise<void> {
    const key = `${this.STORAGE_KEYS.DAILY_DATA}_${data.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  private async getLocalDailyData(date: string): Promise<DailyWellnessData | null> {
    const key = `${this.STORAGE_KEYS.DAILY_DATA}_${date}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }

  // Sync data with server
  async syncData(userId: string): Promise<void> {
    try {
      const lastSync = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);

      // Get all local data newer than last sync
      const keys = await AsyncStorage.getAllKeys();
      const dataKeys = keys.filter(key => key.startsWith(this.STORAGE_KEYS.DAILY_DATA));

      for (const key of dataKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsedData: DailyWellnessData = JSON.parse(data);
          const dataDate = new Date(parsedData.date);

          if (dataDate > lastSyncDate) {
            // Sync to Firestore
            const docRef = doc(db, 'users', userId, 'dailyData', parsedData.date);
            await setDoc(docRef, {
              ...parsedData,
              date: Timestamp.fromDate(dataDate),
            });
          }
        }
      }

      // Update last sync timestamp
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  // Clean up old data (keep last 90 days)
  async cleanupOldData(userId: string): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      // Clean local storage
      const keys = await AsyncStorage.getAllKeys();
      const dataKeys = keys.filter(key => key.startsWith(this.STORAGE_KEYS.DAILY_DATA));

      for (const key of dataKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsedData: DailyWellnessData = JSON.parse(data);
          const dataDate = new Date(parsedData.date);

          if (dataDate < ninetyDaysAgo) {
            await AsyncStorage.removeItem(key);
          }
        }
      }

      // Clean Firestore (would need admin privileges for bulk delete)
      console.log('Local data cleanup completed');
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}

export const dataStorageService = new DataStorageService();