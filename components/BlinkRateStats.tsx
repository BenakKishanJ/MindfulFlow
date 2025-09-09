// components/BlinkRateStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BlinkRateStatsProps {
  blinkRate: number;
  totalBlinks: number;
  sessionTime: number;
  isDetecting: boolean;
  leftEyeBlinks?: number;
  rightEyeBlinks?: number;
  confidence?: number;
}

// type BlinkStatus = 'low' | 'normal' | 'high';

interface StatusInfo {
  status: string;
  color: string;
  icon: string;
  description: string;
  recommendation: string;
}

const BlinkRateStats: React.FC<BlinkRateStatsProps> = ({
  blinkRate,
  totalBlinks,
  sessionTime,
  isDetecting,
  leftEyeBlinks = 0,
  rightEyeBlinks = 0,
  confidence = 0.9
}) => {
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBlinkStatus = (rate: number): StatusInfo => {
    if (rate >= 12 && rate <= 25) {
      return {
        status: 'Normal',
        color: '#22c55e',
        icon: 'checkmark-circle',
        description: 'Healthy blink rate',
        recommendation: 'Keep up the good eye health!'
      };
    } else if (rate < 8) {
      return {
        status: 'Low',
        color: '#ef4444',
        icon: 'warning',
        description: 'Possible eye strain',
        recommendation: 'Take breaks, blink consciously'
      };
    } else if (rate < 12) {
      return {
        status: 'Slightly Low',
        color: '#f59e0b',
        icon: 'alert-circle',
        description: 'Below optimal rate',
        recommendation: 'Consider screen breaks'
      };
    } else {
      return {
        status: 'High',
        color: '#3b82f6',
        icon: 'information-circle',
        description: 'Above average rate',
        recommendation: 'Monitor for patterns'
      };
    }
  };

  const statusInfo = getBlinkStatus(blinkRate);
  const blinkSymmetry = totalBlinks > 0 ? Math.abs(leftEyeBlinks - rightEyeBlinks) / totalBlinks : 0;

  return (
    <View style={styles.container}>
      {/* Header with Status */}
      <View style={styles.headerSection}>
        <View style={styles.statusIndicator}>
          <Ionicons
            name={statusInfo.icon as any}
            size={28}
            color={statusInfo.color}
          />
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
              {statusInfo.status}
            </Text>
            <Text style={styles.statusDescription}>
              {statusInfo.description}
            </Text>
          </View>
        </View>

        {isDetecting && (
          <View style={styles.confidenceIndicator}>
            <Text style={styles.confidenceLabel}>Detection</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceProgress,
                  {
                    width: `${confidence * 100}%`,
                    backgroundColor: confidence > 0.8 ? '#22c55e' : confidence > 0.6 ? '#f59e0b' : '#ef4444'
                  }
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>{(confidence * 100).toFixed(0)}%</Text>
          </View>
        )}
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.primaryStat}>
          <Text style={styles.primaryStatValue}>{blinkRate}</Text>
          <Text style={styles.primaryStatLabel}>Blinks/min</Text>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        </View>

        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryStatValue}>{totalBlinks}</Text>
            <Text style={styles.secondaryStatLabel}>Total</Text>
          </View>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryStatValue}>{formatTime(sessionTime)}</Text>
            <Text style={styles.secondaryStatLabel}>Duration</Text>
          </View>
        </View>
      </View>

      {/* Eye-specific Stats */}
      {totalBlinks > 0 && (
        <View style={styles.eyeStats}>
          <Text style={styles.sectionTitle}>Eye Analysis</Text>
          <View style={styles.eyeStatsGrid}>
            <View style={styles.eyeStat}>
              <Ionicons name="eye" size={20} color="#6b7280" />
              <View style={styles.eyeStatContent}>
                <Text style={styles.eyeStatLabel}>Left Eye</Text>
                <Text style={styles.eyeStatValue}>{leftEyeBlinks}</Text>
              </View>
            </View>
            <View style={styles.eyeStat}>
              <Ionicons name="eye" size={20} color="#6b7280" />
              <View style={styles.eyeStatContent}>
                <Text style={styles.eyeStatLabel}>Right Eye</Text>
                <Text style={styles.eyeStatValue}>{rightEyeBlinks}</Text>
              </View>
            </View>
            <View style={styles.eyeStat}>
              <Ionicons name="analytics" size={20} color="#6b7280" />
              <View style={styles.eyeStatContent}>
                <Text style={styles.eyeStatLabel}>Symmetry</Text>
                <Text style={[
                  styles.eyeStatValue,
                  { color: blinkSymmetry < 0.2 ? '#22c55e' : '#f59e0b' }
                ]}>
                  {((1 - blinkSymmetry) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Health Progress Bar */}
      <View style={styles.healthSection}>
        <Text style={styles.sectionTitle}>Blink Rate Analysis</Text>
        <View style={styles.healthBar}>
          <View style={styles.healthBarTrack}>
            <View
              style={[
                styles.healthProgress,
                {
                  width: `${Math.min((blinkRate / 30) * 100, 100)}%`,
                  backgroundColor: statusInfo.color
                }
              ]}
            />
            {/* Optimal range indicator */}
            <View style={styles.optimalRange} />
          </View>
        </View>
        <View style={styles.healthLabels}>
          <Text style={styles.healthLabel}>0</Text>
          <Text style={[styles.healthLabel, styles.optimalLabel]}>12-25</Text>
          <Text style={styles.healthLabel}>30+</Text>
        </View>
      </View>

      {/* Recommendation */}
      <View style={[styles.recommendationSection, { borderLeftColor: statusInfo.color }]}>
        <Ionicons name="bulb" size={18} color={statusInfo.color} />
        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationTitle}>Recommendation</Text>
          <Text style={styles.recommendationText}>{statusInfo.recommendation}</Text>
        </View>
      </View>

      {/* Detection Tips */}
      {!isDetecting && (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Detection Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Ensure good lighting on your face</Text>
            <Text style={styles.tipItem}>• Keep your face centered in the frame</Text>
            <Text style={styles.tipItem}>• Remove glasses if they cause glare</Text>
            <Text style={styles.tipItem}>• Maintain 30-60cm distance from camera</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerSection: {
    marginBottom: 24,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  confidenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    minWidth: 60,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  confidenceProgress: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 35,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  primaryStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  primaryStatValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  primaryStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  secondaryStats: {
    flex: 1,
    gap: 12,
  },
  secondaryStat: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    borderRadius: 12,
  },
  secondaryStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  secondaryStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  eyeStats: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  eyeStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  eyeStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
  },
  eyeStatContent: {
    marginLeft: 8,
    flex: 1,
  },
  eyeStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  eyeStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  healthSection: {
    marginBottom: 20,
  },
  healthBar: {
    marginBottom: 8,
  },
  healthBarTrack: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  healthProgress: {
    height: '100%',
    borderRadius: 5,
  },
  optimalRange: {
    position: 'absolute',
    left: '40%',
    width: '43%',
    height: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 5,
    opacity: 0.3,
  },
  healthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  optimalLabel: {
    color: '#22c55e',
    fontWeight: '700',
  },
  recommendationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fefefe',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  recommendationContent: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  tipsSection: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontSize: 12,
    color: '#075985',
    lineHeight: 16,
  },
});

export default BlinkRateStats;
