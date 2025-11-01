import { Exercise, ExerciseCategory } from '../types/exercises';

export const exercisesData: Exercise[] = [
  // Eye Exercises
  {
    id: 'eye_20_20_20',
    title: '20-20-20 Rule',
    description: 'Look at something 20 feet away for 20 seconds every 20 minutes',
    type: 'eye',
    difficulty: 'beginner',
    duration: 20,
    instructions: [
      'Set a timer for 20 seconds',
      'Find an object 20 feet (6 meters) away',
      'Focus on that object without blinking',
      'Blink normally when the timer ends',
      'Return to your work'
    ],
    benefits: [
      'Reduces eye strain',
      'Prevents dry eyes',
      'Maintains visual focus',
      'Breaks prolonged screen time'
    ],
    tags: ['prevention', 'quick', 'daily']
  },
  {
    id: 'eye_palming',
    title: 'Palming',
    description: 'Relax your eyes by covering them with your palms',
    type: 'eye',
    difficulty: 'beginner',
    duration: 60,
    instructions: [
      'Rub your hands together to warm them',
      'Close your eyes gently',
      'Place your palms over your eyes',
      'Ensure no light enters',
      'Breathe deeply and relax',
      'Remove palms and blink gently'
    ],
    benefits: [
      'Relieves eye tension',
      'Reduces stress',
      'Improves blood circulation',
      'Helps with dry eyes'
    ],
    tags: ['relaxation', 'stress-relief', 'circulation']
  },
  {
    id: 'eye_figure_eight',
    title: 'Figure Eight',
    description: 'Follow an imaginary figure eight with your eyes',
    type: 'eye',
    difficulty: 'intermediate',
    duration: 30,
    instructions: [
      'Imagine a large figure eight on the wall',
      'Follow the pattern with your eyes',
      'Keep your head still',
      'Go clockwise for 15 seconds',
      'Go counterclockwise for 15 seconds',
      'Blink and relax'
    ],
    benefits: [
      'Improves eye coordination',
      'Strengthens eye muscles',
      'Reduces eye fatigue',
      'Enhances focus flexibility'
    ],
    tags: ['coordination', 'strength', 'flexibility']
  },

  // Posture Exercises
  {
    id: 'posture_neck_roll',
    title: 'Neck Rolls',
    description: 'Gently roll your neck to release tension',
    type: 'posture',
    difficulty: 'beginner',
    duration: 45,
    instructions: [
      'Sit or stand with good posture',
      'Slowly roll your head clockwise',
      'Complete 5 full circles',
      'Switch to counterclockwise',
      'Complete 5 more circles',
      'Return to center position'
    ],
    benefits: [
      'Releases neck tension',
      'Improves neck mobility',
      'Reduces headache risk',
      'Better blood flow'
    ],
    tags: ['mobility', 'tension-relief', 'headache-prevention']
  },
  {
    id: 'posture_shoulder_shrug',
    title: 'Shoulder Shrugs',
    description: 'Lift and release your shoulders to relieve tension',
    type: 'posture',
    difficulty: 'beginner',
    duration: 30,
    instructions: [
      'Sit or stand comfortably',
      'Inhale and lift both shoulders up',
      'Hold for 3 seconds',
      'Exhale and release shoulders down',
      'Repeat 10 times',
      'Shake out arms gently'
    ],
    benefits: [
      'Relieves shoulder tension',
      'Improves posture awareness',
      'Reduces stress',
      'Better shoulder mobility'
    ],
    tags: ['tension-relief', 'stress-relief', 'mobility']
  },
  {
    id: 'posture_cat_cow',
    title: 'Cat-Cow Stretch',
    description: 'Alternate between arching and rounding your back',
    type: 'posture',
    difficulty: 'intermediate',
    duration: 60,
    instructions: [
      'Start on hands and knees',
      'Inhale, arch back, lift head (Cow)',
      'Exhale, round back, tuck chin (Cat)',
      'Alternate slowly for 30 seconds',
      'Return to neutral position',
      'Sit back on heels to rest'
    ],
    benefits: [
      'Improves spinal flexibility',
      'Relieves back tension',
      'Better posture alignment',
      'Stress reduction'
    ],
    tags: ['flexibility', 'back-health', 'alignment']
  },

  // Breathing Exercises
  {
    id: 'breathing_4_7_8',
    title: '4-7-8 Breathing',
    description: 'Calm your nervous system with rhythmic breathing',
    type: 'breathing',
    difficulty: 'intermediate',
    duration: 60,
    instructions: [
      'Inhale quietly through nose for 4 seconds',
      'Hold breath for 7 seconds',
      'Exhale completely through mouth for 8 seconds',
      'Repeat cycle 4 times',
      'Focus on the rhythm',
      'Notice the calming effect'
    ],
    benefits: [
      'Reduces anxiety and stress',
      'Improves sleep quality',
      'Lowers heart rate',
      'Enhances focus and concentration'
    ],
    tags: ['stress-relief', 'anxiety-reduction', 'focus', 'sleep']
  },
  {
    id: 'breathing_box_breathing',
    title: 'Box Breathing',
    description: 'Equal breathing in four directions',
    type: 'breathing',
    difficulty: 'beginner',
    duration: 120,
    instructions: [
      'Inhale for 4 seconds',
      'Hold for 4 seconds',
      'Exhale for 4 seconds',
      'Hold for 4 seconds',
      'Repeat for 2 minutes',
      'Focus on the square pattern',
      'Notice your calm state'
    ],
    benefits: [
      'Reduces stress and anxiety',
      'Improves concentration',
      'Regulates nervous system',
      'Enhances emotional control'
    ],
    tags: ['stress-relief', 'concentration', 'emotional-control']
  },

  // Break Exercises
  {
    id: 'break_walk',
    title: 'Quick Walk',
    description: 'Take a short walk to refresh your body and mind',
    type: 'break',
    difficulty: 'beginner',
    duration: 300, // 5 minutes
    instructions: [
      'Stand up from your workspace',
      'Walk around your space',
      'Take deep breaths',
      'Notice your surroundings',
      'Return refreshed',
      'Resume work with renewed focus'
    ],
    benefits: [
      'Improves circulation',
      'Reduces mental fatigue',
      'Increases energy levels',
      'Better concentration'
    ],
    tags: ['energy', 'circulation', 'mental-refresh', 'focus']
  },
  {
    id: 'break_hydration',
    title: 'Hydration Break',
    description: 'Drink water and stay hydrated',
    type: 'break',
    difficulty: 'beginner',
    duration: 30,
    instructions: [
      'Get a glass of water',
      'Drink slowly and mindfully',
      'Take a few deep breaths',
      'Notice how you feel',
      'Return to your tasks',
      'Stay hydrated throughout the day'
    ],
    benefits: [
      'Maintains hydration',
      'Improves cognitive function',
      'Reduces headaches',
      'Better overall health'
    ],
    tags: ['hydration', 'health', 'cognitive-function', 'prevention']
  }
];

export const exerciseCategories: ExerciseCategory[] = [
  {
    id: 'eye',
    name: 'Eye Exercises',
    description: 'Exercises to reduce eye strain and improve vision health',
    icon: 'eye-outline',
    color: '#3b82f6',
    exercises: exercisesData.filter(e => e.type === 'eye')
  },
  {
    id: 'posture',
    name: 'Posture Exercises',
    description: 'Improve your posture and reduce musculoskeletal strain',
    icon: 'body-outline',
    color: '#10b981',
    exercises: exercisesData.filter(e => e.type === 'posture')
  },
  {
    id: 'breathing',
    name: 'Breathing Exercises',
    description: 'Techniques to reduce stress and improve focus',
    icon: 'leaf-outline',
    color: '#f59e0b',
    exercises: exercisesData.filter(e => e.type === 'breathing')
  },
  {
    id: 'break',
    name: 'Break Activities',
    description: 'Quick activities to refresh during work breaks',
    icon: 'pause-outline',
    color: '#ef4444',
    exercises: exercisesData.filter(e => e.type === 'break')
  }
];