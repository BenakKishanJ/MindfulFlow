// ──────────────────────────────────────────────────────────────────────
//  iOS-Style Scroll Picker Component
// ──────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

type TimePickerProps = {
  initialHours?: number;
  initialMinutes?: number;
  onConfirm: (hours: number, minutes: number) => void;
  onCancel: () => void;
};

const TimePicker: React.FC<TimePickerProps> = ({
  initialHours = 0,
  initialMinutes = 0,
  onConfirm,
  onCancel,
}) => {
  const [selectedHours, setSelectedHours] = useState(initialHours);
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);

  const hoursScrollRef = useRef<ScrollView>(null);
  const minutesScrollRef = useRef<ScrollView>(null);
  const lastHapticHours = useRef(initialHours);
  const lastHapticMinutes = useRef(initialMinutes);

  // Generate arrays for hours (0-23) and minutes (0-59)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Scroll to initial position on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      hoursScrollRef.current?.scrollTo({
        y: initialHours * ITEM_HEIGHT,
        animated: false,
      });
      minutesScrollRef.current?.scrollTo({
        y: initialMinutes * ITEM_HEIGHT,
        animated: false,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [initialHours, initialMinutes]);

  const handleHoursScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const newHour = Math.max(0, Math.min(23, index));

    if (newHour !== lastHapticHours.current) {
      lastHapticHours.current = newHour;
      Haptics.selectionAsync();
      setSelectedHours(newHour);
    }
  };

  const handleMinutesScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const newMinute = Math.max(0, Math.min(59, index));

    if (newMinute !== lastHapticMinutes.current) {
      lastHapticMinutes.current = newMinute;
      Haptics.selectionAsync();
      setSelectedMinutes(newMinute);
    }
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    scrollRef: React.RefObject<ScrollView | null>
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const snappedOffset = index * ITEM_HEIGHT;

    scrollRef.current?.scrollTo({
      y: snappedOffset,
      animated: true,
    });
  };

  const renderPickerColumn = (
    data: number[],
    selectedValue: number,
    scrollRef: React.RefObject<ScrollView | null>,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  ) => {
    return (
      <View style={styles.pickerColumn}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={onScroll}
          onMomentumScrollEnd={(e) => handleMomentumScrollEnd(e, scrollRef)}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingVertical: ITEM_HEIGHT * 2,
          }}
        >
          {data.map((value) => {
            const isSelected = value === selectedValue;
            return (
              <View key={value} style={styles.pickerItem}>
                <Text
                  style={[
                    styles.pickerItemText,
                    isSelected && styles.pickerItemTextSelected,
                  ]}
                >
                  {value.toString().padStart(2, "0")}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onConfirm(selectedHours, selectedMinutes);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Picker Container */}
        <View style={styles.pickerContainer}>
          {/* Selection Highlight */}
          <View style={styles.selectionOverlay} />

          {/* Hours Picker */}
          {renderPickerColumn(
            hours,
            selectedHours,
            hoursScrollRef,
            handleHoursScroll
          )}

          {/* Separator */}
          <View style={styles.separator}>
            <Text style={styles.separatorText}>:</Text>
          </View>

          {/* Minutes Picker */}
          {renderPickerColumn(
            minutes,
            selectedMinutes,
            minutesScrollRef,
            handleMinutesScroll
          )}
        </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Softer overlay
  },
  modal: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F7F7F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cancelButton: {
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 17,
    color: '#66CC33',
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
  },
  selectionOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    backgroundColor: '#F0FDF4', // Very light lime tint
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#A3E635',
    zIndex: 0,
  },
  pickerColumn: {
    height: PICKER_HEIGHT,
    width: 100,
    zIndex: 1,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 22,
    color: '#666666',
    fontWeight: '400',
  },
  pickerItemTextSelected: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  separator: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  separatorText: {
    fontSize: 22,
    color: '#1A1A1A',
    fontWeight: '600',
  },
});

export default TimePicker;

// ──────────────────────────────────────────────────────────────────────
//  USAGE EXAMPLE
// ──────────────────────────────────────────────────────────────────────
/*

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import TimePicker from "./TimePicker";

export default function App() {
  const [showPicker, setShowPicker] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.buttonText}>
          Set Duration: {formatTime(hours, minutes)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TimePicker
          initialHours={hours}
          initialMinutes={minutes}
          onConfirm={(h, m) => {
            setHours(h);
            setMinutes(m);
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

*/
