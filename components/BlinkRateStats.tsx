// components/BlinkRateStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BlinkRateStatsProps {
  blinkRate: number;
  totalBlinks: number;
  sessionTime: number;
  isDetecting: boolean;
}

const BlinkRateStats: React.FC<BlinkRateStatsProps> = ({
  blinkRate,
  totalBlinks,
  sessionTime,
  isDetecting,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getBlinkStatus = (rate: number) => {
    if (rate >= 15 && rate <= 20) return { status: "Normal", color: "#22c55e", icon: "checkmark-circle" };
    if (rate < 10) return { status: "Low - Eye Strain", color: "#ef4444", icon: "warning" };
    if (rate < 15) return { status: "Slightly Low", color: "#f59e0b", icon: "alert-circle" };
    return { status: "High", color: "#f59e0b", icon: "alert-circle" };
  };

  const status = getBlinkStatus(blinkRate);

  return (
    <View style={styles.container}>
      {/* Status Indicator */}
      <View style={styles.statusSection}>
        <Ionicons name={status.icon as any} size={32} color={status.color} />
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.status}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{blinkRate}</Text>
          <Text style={styles.statLabel}>Blinks/min</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalBlinks}</Text>
          <Text style={styles.statLabel}>Total Blinks</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(sessionTime)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
      </View>

      {/* Health Indicator */}
      <View style={styles.healthSection}>
        <Text style={styles.healthLabel}>Eye Health Indicator</Text>
        <View style={styles.healthBar}>
          <View
            style={[
              styles.healthProgress,
              {
                width: `${Math.min((blinkRate / 25) * 100, 100)}%`,
                backgroundColor: status.color
              }
            ]}
          />
        </View>
        <View style={styles.healthLabels}>
          <Text style={styles.healthMin}>0</Text>
          <Text style={styles.healthOptimal}>15-20</Text>
          <Text style={styles.healthMax}>25+</Text>
        </View>
      </View>

      {/* Tips based on status */}
      {!isDetecting && (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Monitoring Tips</Text>
          <Text style={styles.tipsText}>
            • Ensure good lighting on your face{"\n"}
            • Position your face within the camera frame{"\n"}
            • Remove glasses if they cause reflections
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  healthSection: {
    marginBottom: 20,
  },
  healthLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  healthBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  healthProgress: {
    height: '100%',
    borderRadius: 4,
  },
  healthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthMin: {
    fontSize: 10,
    color: '#6b7280',
  },
  healthOptimal: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '600',
  },
  healthMax: {
    fontSize: 10,
    color: '#6b7280',
  },
  tipsSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
});

export default BlinkRateStats;
