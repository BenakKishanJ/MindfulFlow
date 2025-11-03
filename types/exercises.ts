// types/exercises.ts

export type ExerciseType = 'eye' | 'posture' | 'breathing' | 'break';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * A single timed step in an exercise.
 * - `duration`: seconds the step lasts (excluding transition)
 * - `image`: optional – if omitted, the previous step’s image is used
 */
export interface Step {
  title: string;
  duration: number;           // seconds
  image?: any;                // require('@/assets/...') – React Native Image source
}

/**
 * Full exercise definition
 */
export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: ExerciseType;
  difficulty: Difficulty;

  /** Timed, sequential steps (with per-step duration & optional image) */
  steps: Step[];

  /** General guidelines / notes – shown *before* starting */
  instructions: string[];

  /** Benefits – displayed in the exercise card preview */
  benefits: string[];

  tags: string[];
}

/**
 * Category metadata – used for filtering & UI
 */
export interface ExerciseCategory {
  id: ExerciseType;
  name: string;
  description: string;
  icon: string;               // Ionicons name
  color: string;              // Tailwind/hex color
  exercises: Exercise[];      // filtered list (populated in data file)
}
