// ──────────────────────────────────────────────────────────────────────
//  Clock‑Dial Duration Picker - FIXED VERSION
// ──────────────────────────────────────────────────────────────────────
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const DIAL_SIZE = Math.min(width * 0.75, 320);
const KNOB_SIZE = 52;
const CENTER = DIAL_SIZE / 2;
const RADIUS = DIAL_SIZE / 2 - 60;

type ClockDialProps = {
  value: number; // total minutes
  onValueChange: (v: number) => void;
  onSlidingComplete: (v: number) => void;
};

// Helper to format duration
const formatDuration = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0 && m === 0) return "0m";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const ClockDialDurationPicker: React.FC<ClockDialProps> = ({
  value,
  onValueChange,
  onSlidingComplete,
}) => {
  // ── state ───────────────────────────────────────────────────────
  const [step, setStep] = useState<"hours" | "minutes">("hours");
  const [hours, setHours] = useState(Math.floor(value / 60));
  const [minutes, setMinutes] = useState(value % 60);
  const [isDragging, setIsDragging] = useState(false);

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const dialRef = useRef<View>(null);
  const dialPosition = useRef({ x: 0, y: 0 });

  // ── helpers ─────────────────────────────────────────────────────
  const totalMinutes = () => hours * 60 + minutes;

  // Convert value (0-max) to angle in degrees (0° = top, clockwise)
  const valueToAngle = (val: number, max: number): number => {
    return (val / max) * 360;
  };

  // Convert angle (degrees) to value (0-max)
  const angleToValue = (angleDeg: number, max: number): number => {
    // Normalize to 0-360
    let normalized = angleDeg % 360;
    if (normalized < 0) normalized += 360;

    // Convert to value with proper rounding
    const rawValue = (normalized / 360) * max;
    const value = Math.round(rawValue);

    // Handle edge case where we're exactly at 360 degrees (should be max value)
    return normalized >= 359.5 ? max : value % (max + 1);
  };

  // Calculate angle from touch position relative to dial center
  const getTouchAngle = (touchX: number, touchY: number): number => {
    const dx = touchX - dialPosition.current.x;
    const dy = touchY - dialPosition.current.y;

    // atan2 returns angle from positive x-axis (3 o'clock)
    // Convert to: 0° = top (12 o'clock), clockwise positive
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Adjust so 0° is at top and angle increases clockwise
    angle = (angle + 90) % 360;
    if (angle < 0) angle += 360;

    return angle;
  };

  // ── measure dial position ───────────────────────────────────────
  useEffect(() => {
    const measureDial = () => {
      setTimeout(() => {
        dialRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
          dialPosition.current = {
            x: pageX + w / 2,
            y: pageY + h / 2,
          };
        });
      }, 100);
    };

    measureDial();

    // Re-measure on layout changes
    const timeoutId = setInterval(measureDial, 1000);
    return () => clearInterval(timeoutId);
  }, []);

  // ── pan responder ───────────────────────────────────────────────
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Update position immediately on grant
        const { locationX, locationY } = evt.nativeEvent;
        const angle = getTouchAngle(
          dialPosition.current.x + (locationX - CENTER),
          dialPosition.current.y + (locationY - CENTER)
        );
        const max = step === "hours" ? 23 : 59;
        const newValue = angleToValue(angle, max);

        if (step === "hours") {
          setHours(newValue);
          onValueChange(newValue * 60 + minutes);
        } else {
          setMinutes(newValue);
          onValueChange(hours * 60 + newValue);
        }

        Animated.timing(rotationAnim, {
          toValue: angle,
          duration: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
        const angle = getTouchAngle(moveX, moveY);
        const max = step === "hours" ? 23 : 59;
        const newValue = angleToValue(angle, max);

        if (step === "hours") {
          setHours(newValue);
          onValueChange(newValue * 60 + minutes);
        } else {
          setMinutes(newValue);
          onValueChange(hours * 60 + newValue);
        }

        // Animate rotation smoothly
        Animated.timing(rotationAnim, {
          toValue: angle,
          duration: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        onSlidingComplete(totalMinutes());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
    })
  ).current;

  // ── animate when value or step changes ─────────────────────────
  useEffect(() => {
    const currentValue = step === "hours" ? hours : minutes;
    const max = step === "hours" ? 23 : 59;
    const targetAngle = valueToAngle(currentValue, max);

    Animated.spring(rotationAnim, {
      toValue: targetAngle,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [hours, minutes, step]);

  // ── sync with external value changes ────────────────────────────
  useEffect(() => {
    const h = Math.floor(value / 60);
    const m = value % 60;
    setHours(h);
    setMinutes(m);
  }, [value]);

  // ── render clock numbers ────────────────────────────────────────
  const renderClockNumbers = (): React.ReactElement[] => {
    const numbers: React.ReactElement[] = [];

    if (step === "hours") {
      // For hours: show 12, 3, 6, 9, 12, 15, 18, 21 (8 markers total)
      const hourMarkers = [12, 3, 6, 9, 12, 15, 18, 21];

      hourMarkers.forEach((hour, index) => {
        // Map hour to value (0-23) for angle calculation
        const hourValue = hour === 12 && index >= 4 ? 0 : hour; // Second 12 becomes 0
        const angle = valueToAngle(hourValue, 23) * (Math.PI / 180);
        const x = CENTER + RADIUS * Math.sin(angle) - 16;
        const y = CENTER - RADIUS * Math.cos(angle) - 16;

        // Use unique key combining hour and index
        numbers.push(
          <View key={`hour-${hour}-${index}`} style={[styles.marker, { left: x, top: y }]}>
            <Text style={styles.markerText}>{hour}</Text>
          </View>
        );
      });
    } else {
      // For minutes: show 0, 15, 30, 45
      const minuteMarkers = [0, 15, 30, 45];

      minuteMarkers.forEach((minute) => {
        const angle = valueToAngle(minute, 59) * (Math.PI / 180);
        const x = CENTER + RADIUS * Math.sin(angle) - 16;
        const y = CENTER - RADIUS * Math.cos(angle) - 16;

        numbers.push(
          <View key={`minute-${minute}`} style={[styles.marker, { left: x, top: y }]}>
            <Text style={styles.markerText}>{minute}</Text>
          </View>
        );
      });
    }

    return numbers;
  };

  // ── render tick marks ───────────────────────────────────────────
  const renderTicks = (): React.ReactElement[] => {
    const ticks: React.ReactElement[] = [];
    const numTicks = step === "hours" ? 24 : 60;
    const max = numTicks - 1;
    const tickRadius = RADIUS + 25;

    for (let i = 0; i < numTicks; i++) {
      const angle = valueToAngle(i, max) * (Math.PI / 180);
      const x = CENTER + tickRadius * Math.sin(angle);
      const y = CENTER - tickRadius * Math.cos(angle);
      const isMainTick = step === "hours" ? i % 3 === 0 : i % 5 === 0;

      ticks.push(
        <View
          key={`tick-${step}-${i}`}
          style={[
            styles.tick,
            isMainTick ? styles.mainTick : styles.minorTick,
            {
              left: x - (isMainTick ? 1.5 : 1),
              top: y - (isMainTick ? 4 : 2),
            },
          ]}
        />
      );
    }
    return ticks;
  };

  // ── UI ──────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Step Selector */}
      <View style={styles.stepSelector}>
        <TouchableOpacity
          onPress={() => {
            setStep("hours");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[styles.stepButton, step === "hours" && styles.stepButtonActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepButtonText, step === "hours" && styles.stepButtonTextActive]}>
            {hours}h
          </Text>
        </TouchableOpacity>

        <View style={styles.stepDivider}>
          <Text style={styles.stepDividerText}>:</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setStep("minutes");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[styles.stepButton, step === "minutes" && styles.stepButtonActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepButtonText, step === "minutes" && styles.stepButtonTextActive]}>
            {minutes}m
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instruction Text */}
      <Text style={styles.instructionText}>
        Drag the knob to set {step === "hours" ? "hours" : "minutes"}
      </Text>

      {/* Dial */}
      <View
        ref={dialRef}
        style={[styles.dial, isDragging && styles.dialActive]}
        {...pan.panHandlers}
      >
        {/* Tick marks */}
        {renderTicks()}

        {/* Clock numbers */}
        {renderClockNumbers()}

        {/* Center dot */}
        <View style={styles.centerDot} />

        {/* Animated line and knob together */}
        <Animated.View
          style={[
            styles.lineKnobContainer,
            {
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Line from center to knob */}
          <View style={styles.dialLine} />

          {/* Draggable knob at the end */}
          <View
            style={[
              styles.knob,
              { transform: [{ scale: isDragging ? 1.1 : 1 }] },
            ]}
          >
            <View style={styles.knobInner}>
              <Ionicons name="time-outline" size={24} color="#1A1A1A" />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Total Duration Display */}
      <View style={styles.durationDisplay}>
        <Text style={styles.durationLabel}>Total Duration</Text>
        <Text style={styles.durationValue}>{formatDuration(totalMinutes())}</Text>
      </View>

      {/* Quick Presets */}
      <View style={styles.presets}>
        {[15, 30, 60, 120].map((mins) => (
          <TouchableOpacity
            key={mins}
            onPress={() => {
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              setHours(h);
              setMinutes(m);
              onValueChange(mins);
              onSlidingComplete(mins);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.presetButton}
            activeOpacity={0.7}
          >
            <Text style={styles.presetButtonText}>{formatDuration(mins)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 4,
  },
  stepButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  stepButtonActive: {
    backgroundColor: "#A3E635",
    shadowColor: "#84CC16",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
  },
  stepButtonTextActive: {
    color: "#1A1A1A",
    fontWeight: "700",
  },
  stepDivider: {
    paddingHorizontal: 4,
  },
  stepDividerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  instructionText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
  },
  dial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
    borderWidth: 2,
    borderColor: "#F3F4F6",
  },
  dialActive: {
    borderColor: "#A3E635",
    shadowColor: "#84CC16",
    shadowOpacity: 0.2,
  },
  tick: {
    position: "absolute",
  },
  mainTick: {
    width: 3,
    height: 8,
    backgroundColor: "#9CA3AF",
    borderRadius: 1.5,
  },
  minorTick: {
    width: 2,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 1,
  },
  marker: {
    position: "absolute",
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  markerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  centerDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D1D5DB",
    left: CENTER - 6,
    top: CENTER - 6,
    zIndex: 10,
  },
  lineKnobContainer: {
    position: "absolute",
    left: CENTER - KNOB_SIZE / 2,
    top: CENTER - KNOB_SIZE / 2,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    zIndex: 15,
  },
  dialLine: {
    position: "absolute",
    width: 3,
    height: RADIUS - KNOB_SIZE / 2,
    backgroundColor: "#A3E635",
    left: KNOB_SIZE / 2 - 1.5,
    bottom: KNOB_SIZE / 2,
    borderRadius: 1.5,
    transformOrigin: "bottom center",
  },
  knob: {
    position: "absolute",
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    left: 0,
    top: 0,
  },
  knobInner: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#A3E635",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#84CC16",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  durationDisplay: {
    marginTop: 24,
    alignItems: "center",
  },
  durationLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  presets: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
});

export default ClockDialDurationPicker;
