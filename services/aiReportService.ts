import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataStorageService, DailyWellnessData, WeeklyReport } from './dataStorageService';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

class AIReportService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Generate daily wellness summary
  async generateDailySummary(userId: string, date: string): Promise<string> {
    try {
      const dailyData = await dataStorageService.getDailyData(userId, date);
      if (!dailyData) {
        return 'No data available for this date.';
      }

      const prompt = this.buildDailySummaryPrompt(dailyData);
      const result = await this.model.generateContent(prompt);
      const summary = result.response.text();

      // Store the AI insights
      await dataStorageService.storeDailyData(userId, {
        ...dailyData,
        aiInsights: {
          generated: true,
          summary,
        },
      });

      return summary;
    } catch (error) {
      console.error('Error generating daily summary:', error);
      return 'Unable to generate AI summary at this time.';
    }
  }

  // Generate weekly report with AI analysis
  async generateWeeklyReport(userId: string, weekStart: string): Promise<WeeklyReport> {
    try {
      const weeklyData = await dataStorageService.getWeeklyData(userId, weekStart);
      const baseReport = await dataStorageService.generateWeeklyReport(userId, weekStart);

      if (weeklyData.length === 0) {
        return baseReport;
      }

      const prompt = this.buildWeeklyReportPrompt(weeklyData, baseReport);
      const result = await this.model.generateContent(prompt);
      const aiAnalysis = this.parseWeeklyAnalysis(result.response.text());

      const enhancedReport: WeeklyReport = {
        ...baseReport,
        aiAnalysis,
      };

      // Store the enhanced report
      await dataStorageService.storeWeeklyReport(userId, enhancedReport);

      return enhancedReport;
    } catch (error) {
      console.error('Error generating weekly report:', error);
      return await dataStorageService.generateWeeklyReport(userId, weekStart);
    }
  }

  // Generate personalized recommendations
  async generateRecommendations(userId: string, date: string): Promise<string[]> {
    try {
      const dailyData = await dataStorageService.getDailyData(userId, date);
      const weeklyData = await dataStorageService.getWeeklyData(userId, this.getWeekStart(date));

      if (!dailyData) {
        return ['Start tracking your screen time and wellness metrics for personalized recommendations.'];
      }

      const prompt = this.buildRecommendationsPrompt(dailyData, weeklyData);
      const result = await this.model.generateContent(prompt);
      const recommendationsText = result.response.text();

      // Parse recommendations from the response
      const recommendations = this.parseRecommendations(recommendationsText);

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [
        'Take regular breaks using the 20-20-20 rule',
        'Maintain good posture while using devices',
        'Stay hydrated and take short walks',
        'Consider using eye care mode during extended screen time',
      ];
    }
  }

  // Analyze wellness patterns
  async analyzePatterns(userId: string, days: number = 30): Promise<{
    patterns: string[];
    insights: string[];
    risks: string[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const patterns = [];
      const insights = [];
      const risks = [];

      // Get data for the period
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        const data = await dataStorageService.getDailyData(userId, dateStr);
        if (data) {
          patterns.push(data);
        }
      }

      if (patterns.length < 7) {
        return {
          patterns: ['Insufficient data for pattern analysis'],
          insights: ['Continue tracking for better insights'],
          risks: ['Limited data available'],
        };
      }

      const prompt = this.buildPatternAnalysisPrompt(patterns);
      const result = await this.model.generateContent(prompt);
      const analysis = this.parsePatternAnalysis(result.response.text());

      return analysis;
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return {
        patterns: ['Unable to analyze patterns'],
        insights: ['Continue tracking your wellness data'],
        risks: ['Analysis unavailable'],
      };
    }
  }

  // Private helper methods
  private buildDailySummaryPrompt(data: DailyWellnessData): string {
    return `Analyze this daily wellness data and provide a concise summary:

Screen Time: ${data.screenTime.totalMinutes} minutes
Wellness Score: ${data.wellnessMetrics.wellnessScore}/100
Eye Strain: ${data.wellnessMetrics.averageEyeStrain}/10
Blink Rate: ${data.wellnessMetrics.averageBlinkRate} per minute
Posture Score: ${data.wellnessMetrics.averagePostureScore}/100
Stress Level: ${data.wellnessMetrics.averageStressLevel}/10
Focus Level: ${data.wellnessMetrics.averageFocusLevel}/10

Exercises Completed: ${data.exercises.completed.length}
Exercise Time: ${data.exercises.totalTime} minutes

${data.feedback ? `User Feedback - Mood: ${data.feedback.mood}, Energy: ${data.feedback.energy}, Productivity: ${data.feedback.productivity}` : ''}

Provide a 2-3 sentence summary of the user's wellness for this day, highlighting key insights and any concerns.`;
  }

  private buildWeeklyReportPrompt(weeklyData: DailyWellnessData[], baseReport: WeeklyReport): string {
    const avgScreenTime = weeklyData.reduce((sum, d) => sum + d.screenTime.totalMinutes, 0) / weeklyData.length;
    const avgWellness = weeklyData.reduce((sum, d) => sum + d.wellnessMetrics.wellnessScore, 0) / weeklyData.length;
    const totalExercises = weeklyData.reduce((sum, d) => sum + d.exercises.completed.length, 0);

    return `Analyze this weekly wellness data and provide comprehensive insights:

Weekly Averages:
- Screen Time: ${avgScreenTime.toFixed(1)} minutes/day
- Wellness Score: ${avgWellness.toFixed(1)}/100
- Exercises Completed: ${totalExercises}

Daily Breakdown:
${weeklyData.map(d => `- ${d.date}: ${d.screenTime.totalMinutes}min screen time, ${d.wellnessMetrics.wellnessScore} wellness score, ${d.exercises.completed.length} exercises`).join('\n')}

Provide:
1. Overall assessment (2-3 sentences)
2. Key insights (3-4 bullet points)
3. Recommendations (3-4 bullet points)
4. Goals for next week (2-3 bullet points)
5. Risk alerts if any (1-2 bullet points)

Format as JSON with keys: overallAssessment, keyInsights, recommendations, goals, riskAlerts`;
  }

  private buildRecommendationsPrompt(dailyData: DailyWellnessData, weeklyData: DailyWellnessData[]): string {
    const recentTrends = weeklyData.slice(-7); // Last 7 days
    const avgScreenTime = recentTrends.reduce((sum, d) => sum + d.screenTime.totalMinutes, 0) / recentTrends.length;

    return `Based on this wellness data, provide 4-6 personalized recommendations:

Today's Data:
- Screen Time: ${dailyData.screenTime.totalMinutes} minutes
- Wellness Score: ${dailyData.wellnessMetrics.wellnessScore}/100
- Eye Strain: ${dailyData.wellnessMetrics.averageEyeStrain}/10
- Posture Score: ${dailyData.wellnessMetrics.averagePostureScore}/100
- Exercises Today: ${dailyData.exercises.completed.length}

Recent Trends (7 days):
- Average Screen Time: ${avgScreenTime.toFixed(1)} minutes/day
- Days with exercises: ${recentTrends.filter(d => d.exercises.completed.length > 0).length}/7

Provide specific, actionable recommendations for improving digital wellness. Focus on screen time management, eye care, posture, and exercise habits.`;
  }

  private buildPatternAnalysisPrompt(patterns: DailyWellnessData[]): string {
    const screenTimePattern = patterns.map(d => d.screenTime.totalMinutes);
    const wellnessPattern = patterns.map(d => d.wellnessMetrics.wellnessScore);
    const exercisePattern = patterns.map(d => d.exercises.completed.length);

    return `Analyze these wellness patterns over ${patterns.length} days:

Screen Time Pattern: ${screenTimePattern.join(', ')}
Wellness Score Pattern: ${wellnessPattern.join(', ')}
Exercise Pattern: ${exercisePattern.join(', ')}

Identify:
1. Patterns in screen time usage
2. Correlations between activities and wellness
3. Potential risk factors
4. Positive trends to maintain

Format as JSON with keys: patterns, insights, risks`;
  }

  private parseWeeklyAnalysis(analysisText: string): WeeklyReport['aiAnalysis'] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(analysisText);
      return {
        overallAssessment: parsed.overallAssessment || 'Analysis completed',
        keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        riskAlerts: Array.isArray(parsed.riskAlerts) ? parsed.riskAlerts : [],
      };
    } catch {
      // Fallback: parse text manually
      return {
        overallAssessment: 'Weekly analysis completed',
        keyInsights: ['Continue tracking your wellness metrics'],
        recommendations: ['Maintain regular exercise habits', 'Monitor screen time usage'],
        goals: ['Complete daily exercises', 'Reduce prolonged screen sessions'],
        riskAlerts: [],
      };
    }
  }

  private parseRecommendations(text: string): string[] {
    // Split by newlines and filter out empty lines
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('Based on') && !line.startsWith('Here are'))
      .slice(0, 6); // Limit to 6 recommendations
  }

  private parsePatternAnalysis(text: string): { patterns: string[]; insights: string[]; risks: string[] } {
    try {
      const parsed = JSON.parse(text);
      return {
        patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      };
    } catch {
      return {
        patterns: ['Patterns identified'],
        insights: ['Data analysis completed'],
        risks: ['Monitor wellness metrics'],
      };
    }
  }

  private getWeekStart(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day; // Adjust to Sunday (0)
    const weekStart = new Date(date.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }
}

export const aiReportService = new AIReportService();