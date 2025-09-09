// components/FaceMeshOverlay.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { FaceDetectionResult } from '@/types/face-detection';

interface FaceMeshOverlayProps {
  faces: FaceDetectionResult[];
}

const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({ faces }) => {
  if (!faces || faces.length === 0) {
    return null;
  }

  const renderFaceLandmarks = (face: FaceDetectionResult) => {
    const { landmarks, leftEyeOpenProbability = 1, rightEyeOpenProbability = 1 } = face;
    if (!landmarks) return null;

    const elements = [];
    const landmarkColor = '#8B5CF6';
    const landmarkRadius = 3;

    // Draw face bounding box
    elements.push(
      <Rect
        key="face-bounds"
        x={face.bounds.origin.x}
        y={face.bounds.origin.y}
        width={face.bounds.size.width}
        height={face.bounds.size.height}
        fill="none"
        stroke={landmarkColor}
        strokeWidth="2"
        strokeDasharray="4,4"
        opacity={0.7}
      />
    );

    // Draw eye indicators
    if (landmarks.leftEye) {
      const color = leftEyeOpenProbability > 0.5 ? '#22c55e' : '#ef4444';
      elements.push(
        <Circle
          key="left-eye"
          cx={landmarks.leftEye.x}
          cy={landmarks.leftEye.y}
          r={8}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      );
    }

    if (landmarks.rightEye) {
      const color = rightEyeOpenProbability > 0.5 ? '#22c55e' : '#ef4444';
      elements.push(
        <Circle
          key="right-eye"
          cx={landmarks.rightEye.x}
          cy={landmarks.rightEye.y}
          r={8}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      );
    }

    // Draw facial landmarks
    Object.entries(landmarks).forEach(([key, point]) => {
      if (point && typeof point === 'object' && 'x' in point && 'y' in point) {
        elements.push(
          <Circle
            key={key}
            cx={point.x}
            cy={point.y}
            r={landmarkRadius}
            fill={landmarkColor}
            opacity={0.8}
          />
        );
      }
    });

    return elements;
  };

  return (
    <View style={styles.overlay}>
      <Svg style={StyleSheet.absoluteFillObject}>
        {faces.map((face, index) => (
          <React.Fragment key={index}>
            {renderFaceLandmarks(face)}
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});

export default FaceMeshOverlay;
