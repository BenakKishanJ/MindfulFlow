// data/exercisesData.ts
import { Exercise, ExerciseCategory, ExerciseType } from '@/types/exercises';

// -----------------------------------------------------------------------------
// Helper: placeholder images (you can replace these with real assets later)
// -----------------------------------------------------------------------------
const IMG = {
  placeholder: require('@/assets/images/exercises/placeholder.png'),

  // Eye exercises
  eye_20_20_20: require('@/assets/images/exercises/eye_20_20_20.png'),
  eye_palming_cover: require('@/assets/images/exercises/eye_palming_cover.png'),
  eye_palming_breathe: require('@/assets/images/exercises/eye_palming_breathe.png'),
  eye_figure_eight: require('@/assets/images/exercises/eye_figure_eight.png'),

  // Posture exercises
  posture_neck_roll: require('@/assets/images/exercises/posture_neck_roll.png'),
  posture_shoulder_shrug: require('@/assets/images/exercises/posture_shoulder_shrug.png'),
  posture_cat_cow_cow: require('@/assets/images/exercises/posture_cat_cow_cow.png'),
  posture_cat_cow_cat: require('@/assets/images/exercises/posture_cat_cow_cat.png'),

  // Breathing exercises
  breathing_4_7_8: require('@/assets/images/exercises/breathing_4_7_8.png'),
  breathing_box: require('@/assets/images/exercises/breathing_box.png'),

  // Break activities
  break_walk: require('@/assets/images/exercises/break_walk.png'),
  break_hydration: require('@/assets/images/exercises/break_hydration.png'),
};

// -----------------------------------------------------------------------------
// EXERCISE DATA
// -----------------------------------------------------------------------------
export const exercisesData: Exercise[] = [
  // -------------------------------------------------------------------------
  // EYE EXERCISES
  // -------------------------------------------------------------------------
  {
    id: 'eye_20_20_20',
    title: '20-20-20 Rule',
    description: 'Look at something 20 feet away for 20 seconds every 20 minutes',
    type: 'eye',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Look 20 feet away',
        duration: 20,
        image: IMG.eye_20_20_20,
      },
    ],
    instructions: [
      'Find an object at least 20 feet (6 meters) away.',
      'Avoid blinking if possible – let your eyes relax.',
      'Use this break every 20 minutes of screen time.',
    ],
    benefits: [
      'Reduces eye strain',
      'Prevents dry eyes',
      'Maintains visual focus',
      'Breaks prolonged screen time',
    ],
    tags: ['prevention', 'quick', 'daily'],
  },

  {
    id: 'eye_palming',
    title: 'Palming',
    description: 'Relax your eyes by covering them with your palms',
    type: 'eye',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Rub hands & cover eyes',
        duration: 40,
        image: IMG.eye_palming_cover,
      },
      {
        title: 'Breathe deeply & relax',
        duration: 15,
        image: IMG.eye_palming_breathe,
      },
      {
        title: 'Remove palms & blink',
        duration: 5,
        image: IMG.eye_palming_breathe,
      },
    ],
    instructions: [
      'Ensure no light leaks through your palms.',
      'Keep shoulders relaxed and breathe slowly.',
      'Do this in a quiet, dimly lit space for best effect.',
    ],
    benefits: [
      'Relieves eye tension',
      'Reduces stress',
      'Improves blood circulation',
      'Helps with dry eyes',
    ],
    tags: ['relaxation', 'stress-relief', 'circulation'],
  },

  {
    id: 'eye_figure_eight',
    title: 'Figure Eight',
    description: 'Follow an imaginary figure eight with your eyes',
    type: 'eye',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Trace clockwise',
        duration: 15,
        image: IMG.eye_figure_eight,
      },
      {
        title: 'Trace counterclockwise',
        duration: 15,
        image: IMG.eye_figure_eight,
      },
    ],
    instructions: [
      'Keep your head completely still.',
      'Imagine a large horizontal figure-eight about 3 feet in front of you.',
      'Move only your eyes, not your neck.',
    ],
    benefits: [
      'Improves eye coordination',
      'Strengthens eye muscles',
      'Reduces eye fatigue',
      'Enhances focus flexibility',
    ],
    tags: ['coordination', 'strength', 'flexibility'],
  },

  // -------------------------------------------------------------------------
  // POSTURE EXERCISES
  // -------------------------------------------------------------------------
  {
    id: 'posture_neck_roll',
    title: 'Neck Rolls',
    description: 'Gently roll your neck to release tension',
    type: 'posture',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Roll clockwise (5 circles)',
        duration: 25,
        image: IMG.posture_neck_roll,
      },
      {
        title: 'Roll counterclockwise (5 circles)',
        duration: 25,
        image: IMG.posture_neck_roll,
      },
    ],
    instructions: [
      'Move slowly to avoid dizziness.',
      'Stop immediately if you feel pain.',
      'Breathe deeply throughout.',
    ],
    benefits: [
      'Releases neck tension',
      'Improves neck mobility',
      'Reduces headache risk',
      'Better blood flow',
    ],
    tags: ['mobility', 'tension-relief', 'headache-prevention'],
  },

  {
    id: 'posture_shoulder_shrug',
    title: 'Shoulder Shrugs',
    description: 'Lift and release your shoulders to relieve tension',
    type: 'posture',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Lift, hold, release (10 reps)',
        duration: 45,
        image: IMG.posture_shoulder_shrug,
      },
    ],
    instructions: [
      'Inhale as you lift, exhale as you drop.',
      'Keep arms relaxed at your sides.',
      'Do not force the shrug – go only to comfort.',
    ],
    benefits: [
      'Relieves shoulder tension',
      'Improves posture awareness',
      'Reduces stress',
      'Better shoulder mobility',
    ],
    tags: ['tension-relief', 'stress-relief', 'mobility'],
  },

  {
    id: 'posture_cat_cow',
    title: 'Cat-Cow Stretch',
    description: 'Alternate between arching and rounding your back',
    type: 'posture',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Cow pose (inhale)',
        duration: 30,
        image: IMG.posture_cat_cow_cow,
      },
      {
        title: 'Cat pose (exhale)',
        duration: 30,
        image: IMG.posture_cat_cow_cat,
      },
    ],
    instructions: [
      'Stay on all fours with wrists under shoulders, knees under hips.',
      'Move slowly and sync breath with motion.',
      'Keep neck neutral – don’t crank it up or down.',
    ],
    benefits: [
      'Improves spinal flexibility',
      'Relieves back tension',
      'Better posture alignment',
      'Stress reduction',
    ],
    tags: ['flexibility', 'back-health', 'alignment'],
  },

  // -------------------------------------------------------------------------
  // BREATHING EXERCISES
  // -------------------------------------------------------------------------
  {
    id: 'breathing_4_7_8',
    title: '4-7-8 Breathing',
    description: 'Calm your nervous system with rhythmic breathing',
    type: 'breathing',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Inhale (4s) → Hold (7s) → Exhale (8s)',
        duration: 19,
        image: IMG.breathing_4_7_8,
      },
      {
        title: 'Repeat cycle ×3',
        duration: 57,
        image: IMG.breathing_4_7_8,
      },
    ],
    instructions: [
      'Sit comfortably with a straight back.',
      'Exhale completely through the mouth to start.',
      'Use a soft “whoosh” sound when exhaling.',
    ],
    benefits: [
      'Reduces anxiety and stress',
      'Improves sleep quality',
      'Lowers heart rate',
      'Enhances focus and concentration',
    ],
    tags: ['stress-relief', 'anxiety-reduction', 'focus', 'sleep'],
  },

  {
    id: 'breathing_box_breathing',
    title: 'Box Breathing',
    description: 'Equal breathing in four directions',
    type: 'breathing',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Inhale → Hold → Exhale → Hold (4s each)',
        duration: 16,
        image: IMG.breathing_box,
      },
      {
        title: 'Repeat for 2 minutes',
        duration: 104,
        image: IMG.breathing_box,
      },
    ],
    instructions: [
      'Visualize tracing a square with each phase.',
      'Keep breaths smooth and controlled.',
      'You may close your eyes for deeper focus.',
    ],
    benefits: [
      'Reduces stress and anxiety',
      'Improves concentration',
      'Regulates nervous system',
      'Enhances emotional control',
    ],
    tags: ['stress-relief', 'concentration', 'emotional-control'],
  },

  // -------------------------------------------------------------------------
  // BREAK ACTIVITIES
  // -------------------------------------------------------------------------
  {
    id: 'break_walk',
    title: 'Quick Walk',
    description: 'Take a short walk to refresh your body and mind',
    type: 'break',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Walk around & breathe deeply',
        duration: 300,
        image: IMG.break_walk,
      },
    ],
    instructions: [
      'Leave your workspace completely.',
      'Notice your surroundings and posture.',
      'Walk at a comfortable pace.',
    ],
    benefits: [
      'Improves circulation',
      'Reduces mental fatigue',
      'Increases energy levels',
      'Better concentration',
    ],
    tags: ['energy', 'circulation', 'mental-refresh', 'focus'],
  },

  {
    id: 'break_hydration',
    title: 'Hydration Break',
    description: 'Drink water and stay hydrated',
    type: 'break',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Drink water mindfully',
        duration: 30,
        image: IMG.break_hydration,
      },
    ],
    instructions: [
      'Sip slowly – don’t gulp.',
      'Take a few deep breaths while drinking.',
      'Refill your bottle for the day.',
    ],
    benefits: [
      'Maintains hydration',
      'Improves cognitive function',
      'Reduces headaches',
      'Better overall health',
    ],
    tags: ['hydration', 'health', 'cognitive-function', 'prevention'],
  },
];

// -----------------------------------------------------------------------------
// CATEGORIES (unchanged structure, just reference filtered data)
// -----------------------------------------------------------------------------
export const exerciseCategories: ExerciseCategory[] = [
  {
    id: 'eye',
    name: 'Eye Exercises',
    description: 'Exercises to reduce eye strain and improve vision health',
    icon: 'eye-outline',
    color: '#3b82f6',
    exercises: exercisesData.filter((e) => e.type === 'eye'),
  },
  {
    id: 'posture',
    name: 'Posture Exercises',
    description: 'Improve your posture and reduce musculoskeletal strain',
    icon: 'body-outline',
    color: '#10b981',
    exercises: exercisesData.filter((e) => e.type === 'posture'),
  },
  {
    id: 'breathing',
    name: 'Breathing Exercises',
    description: 'Techniques to reduce stress and improve focus',
    icon: 'leaf-outline',
    color: '#f59e0b',
    exercises: exercisesData.filter((e) => e.type === 'breathing'),
  },
  {
    id: 'break',
    name: 'Break Activities',
    description: 'Quick activities to refresh during work breaks',
    icon: 'pause-outline',
    color: '#ef4444',
    exercises: exercisesData.filter((e) => e.type === 'break'),
  },
];
