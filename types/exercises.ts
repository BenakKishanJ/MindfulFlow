export type ExerciseType = 'eye' | 'posture' | 'breathing' | 'break';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
  duration: number; // seconds
  instructions: string[];
  benefits: string[];
  imageUrl?: string;
  audioUrl?: string;
  tags: string[];
}

export interface ExerciseSession {
  id: string;
  exerciseId: string;
  startedAt: Date;
  completedAt?: Date;
  duration: number; // actual duration in seconds
  rating?: number; // 1-5 user satisfaction rating
  notes?: string;
}

export interface TwentyTwentyTimer {
  isActive: boolean;
  timeRemaining: number; // seconds
  totalDuration: number; // 20 seconds
  currentPhase: 'looking' | 'resting';
  completedCycles: number;
}

export interface ExerciseProgress {
  totalSessions: number;
  totalTime: number; // minutes
  favoriteExercises: string[];
  weeklyGoal: number; // sessions per week
  currentWeekProgress: number;
  streakDays: number;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  exercises: Exercise[];
}