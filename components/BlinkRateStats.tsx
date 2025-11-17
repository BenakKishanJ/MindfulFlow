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
    if (rate >= 15 && rate <= 20)
      return { status: "Optimal", color: "#A3E635", icon: "checkmark-circle" as const };
    if (rate < 10)
      return { status: "Low – Risk of Strain", color: "#ef4444", icon: "warning" as const };
    if (rate < 15)
      return { status: "Slightly Low", color: "#f97316", icon: "alert-circle" as const };
    return { status: "High – Relax Eyes", color: "#f59e0b", icon: "alert-circle" as const };
  };

  const { status, color, icon } = getBlinkStatus(blinkRate);
  const progress = Math.min((blinkRate / 25) * 100, 100);

  return (
    <View style={styles.container}>
      {/* Header Status */}
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <Ionicons name={icon} size={28} color={color} />
          <Text style={[styles.statusText, { color }]}>{status}</Text>
        </View>
        <Text style={styles.title}>Blink Rate Monitor</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{blinkRate}</Text>
          <Text style={styles.statLabel}>Blinks/min</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalBlinks}</Text>
          <Text style={styles.statLabel}>Total Blinks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatTime(sessionTime)}</Text>
          <Text style={styles.statLabel}>Session Time</Text>
        </View>
      </View>

      {/* Health Progress Bar */}
      <View style={styles.healthSection}>
        <Text style={styles.healthTitle}>Eye Health Score</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: color },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.labelLow}>Low</Text>
          <Text style={styles.labelOptimal}>Optimal (15–20)</Text>
          <Text style={styles.labelHigh}>High</Text>
        </View>
      </View>

      {/* Tips (only when not detecting) */}
      {!isDetecting && (
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color="#A3E635" />
            <Text style={styles.tipsTitle}>Pro Tips for Better Detection</Text>
          </View>
          <Text style={styles.tipsText}>
            • Sit in a well-lit room{"\n"}
            • Keep your full face in the frame{"\n"}
            • Remove glasses if they reflect light{"\n"}
            • Avoid moving too quickly
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  healthSection: {
    marginBottom: 20,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelLow: {
    fontSize: 11,
    color: '#6B7280',
  },
  labelOptimal: {
    fontSize: 11,
    color: '#A3E635',
    fontWeight: '600',
  },
  labelHigh: {
    fontSize: 11,
    color: '#6B7280',
  },
  tipsCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#A3E635',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  tipsText: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default BlinkRateStats;
