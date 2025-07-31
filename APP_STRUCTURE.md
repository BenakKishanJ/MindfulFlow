# MindfulFlow Mobile App Structure

## Overview
This document outlines the structure and components of the MindfulFlow mobile application, an AI-powered digital wellness companion built with React Native and Expo.

## Project Structure

```
mobile_app/
├── app/
│   ├── (tabs)/                 # Tab-based navigation
│   │   ├── _layout.tsx         # Tab navigation configuration
│   │   ├── index.tsx           # Monitor page (main tracking)
│   │   ├── dashboard.tsx       # Dashboard with analytics
│   │   ├── insights.tsx        # AI-powered insights
│   │   ├── profile.tsx         # User profile and stats
│   │   └── settings.tsx        # App settings and preferences
│   └── _layout.tsx             # Root layout configuration
├── assets/                     # Static assets (images, icons)
├── globals.css                 # Global styles with NativeWind
└── package.json               # Dependencies and scripts
```

## Page Components

### 1. Monitor Page (`index.tsx`)
**Purpose**: Real-time wellness monitoring interface
**Features**:
- Start/stop monitoring controls
- Live metrics display (eye strain, posture, emotion)
- Session timer
- Quick action buttons (break, stretch)
- Progress bars and status indicators

**Key Components**:
- Monitoring toggle with session timer
- Real-time metric cards (Eye Health, Posture, Emotional State)
- Status indicators with color-coded feedback
- Quick action buttons for immediate wellness actions

### 2. Dashboard Page (`dashboard.tsx`)
**Purpose**: Comprehensive wellness analytics and trends
**Features**:
- Period selector (Today, This Week, This Month)
- Overall wellness score display
- Statistics grid with trends
- 7-day trend charts
- Health insights and recommendations
- Daily goals progress tracking

**Key Components**:
- Wellness score with visual progress indicator
- Statistical cards with trend indicators
- Mini charts for weekly data visualization
- Insights section with actionable recommendations
- Goal tracking with progress bars

### 3. Insights Page (`insights.tsx`)
**Purpose**: AI-generated wellness summaries and recommendations
**Features**:
- Tab navigation (Summary, Trends, AI Insights)
- Daily wellness summaries
- Personalized recommendations
- Weekly trend analysis
- AI-powered pattern recognition
- Priority-based insights

**Key Components**:
- Daily summary with overall score
- Recommendation cards with actionable advice
- Trend analysis with directional indicators
- AI insights with priority levels
- Local AI processing information

### 4. Profile Page (`profile.tsx`)
**Purpose**: User account management and personal statistics
**Features**:
- User information display
- Premium upgrade options
- Personal wellness journey stats
- Account management options
- Data export functionality

**Key Components**:
- User profile card with avatar
- Statistics grid (sessions, screen time, streak, average score)
- Menu sections for different settings categories
- Premium upgrade prompt
- Account actions (export, delete)

### 5. Settings Page (`settings.tsx`)
**Purpose**: App configuration and preferences
**Features**:
- Notification preferences
- Monitoring settings toggles
- Wellness configuration
- Privacy and security options
- Appearance customization
- Advanced developer options

**Key Components**:
- Grouped settings sections
- Toggle switches for boolean settings
- Select items for choice-based settings
- Storage usage information
- Reset functionality

## Navigation Structure

### Tab Navigation
The app uses Expo Router with tab-based navigation:
- **Monitor** (eye icon): Real-time tracking interface
- **Dashboard** (analytics icon): Statistics and trends
- **Insights** (bulb icon): AI-generated recommendations
- **Profile** (person icon): User account and stats
- **Settings** (settings icon): App configuration

### Tab Configuration
- Active tab color: Purple (#8B5CF6)
- Inactive tab color: Gray (#6B7280)
- Tab bar styling with proper spacing and height
- Icons from Ionicons library

## Design System

### Color Scheme
- Primary: Purple (#8B5CF6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Neutral: Gray scale (#F3F4F6 to #111827)

### Typography
- Headers: Bold, various sizes (text-3xl, text-2xl, text-lg)
- Body text: Regular weight, readable sizes
- Captions: Smaller, muted colors for secondary info

### Layout Patterns
- Safe area handling with SafeAreaView
- Consistent padding (px-4, py-6)
- Card-based design with rounded corners (rounded-2xl)
- Shadow effects for depth (shadow-sm)
- Responsive spacing with Tailwind classes

## Key Features Implementation

### Real-time Monitoring
- Mock data generation for development
- Live metric updates with timers
- Status indicators with color coding
- Session tracking with formatted time display

### Data Visualization
- Progress bars for scores and metrics
- Mini charts for trend visualization
- Status badges with appropriate colors
- Grid layouts for statistics

### User Interaction
- Alert dialogs for confirmations
- Toggle switches for settings
- Touch feedback for all interactive elements
- Modal-style selections for options

### Privacy Focus
- Local data processing emphasis
- Clear privacy settings section
- Data export options
- Account deletion functionality

## Mock Data Structure

### User Stats
```typescript
{
  totalSessions: number,
  totalScreenTime: string,
  wellnessStreak: number,
  averageScore: number
}
```

### Wellness Metrics
```typescript
{
  eyeStrain: number[],      // Historical data
  postureScore: number[],   // Historical data
  breaksTaken: number[],    // Historical data
  sessionTime: number[]     // Historical data
}
```

### AI Insights
```typescript
{
  type: 'pattern' | 'habit' | 'alert',
  title: string,
  description: string,
  priority: 'high' | 'medium' | 'low'
}
```

## Future Implementation Notes

### Phase 2 (Sensor Integration)
- Camera and gyroscope access
- Real sensor data processing
- Live inference integration

### Phase 3 (ML Models)
- TensorFlow Lite model integration
- Real-time classification
- Threshold-based alerts

### Phase 4 (AI Summaries)
- Local LLM integration
- Context-aware recommendations
- Personalized insights generation

## Development Guidelines

### Code Organization
- Functional components with hooks
- TypeScript for type safety
- Consistent naming conventions
- Modular component structure

### Styling
- NativeWind for Tailwind CSS styling
- Consistent color and spacing system
- Responsive design considerations
- Accessibility-friendly implementations

### State Management
- Local state with useState for page-specific data
- Future: Context API or Redux for global state
- Local storage for user preferences

This structure provides a solid foundation for the MindfulFlow application, with clear separation of concerns and scalable architecture for future enhancements.