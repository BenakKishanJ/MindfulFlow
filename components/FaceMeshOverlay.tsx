// components/FaceMeshOverlay.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Line, Path } from 'react-native-svg';
import { FaceDetectionResult } from '@/types/face-detection';

interface FaceMeshOverlayProps {
  faces: FaceDetectionResult[];
  showLandmarks?: boolean;
  showBoundingBox?: boolean;
  showEyeStatus?: boolean;
}

const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  faces,
  showLandmarks = true,
  showBoundingBox = true,
  showEyeStatus = true
}) => {
  if (!faces || faces.length === 0) {
    return null;
  }

  const renderFaceDetection = (face: FaceDetectionResult, index: number) => {
    const { bounds, landmarks, leftEyeOpenProbability = 1, rightEyeOpenProbability = 1 } = face;
    const elements: React.ReactElement[] = [];

    // Colors
    const primaryColor = '#8B5CF6';
    const successColor = '#22c55e';
    const warningColor = '#f59e0b';
    const errorColor = '#ef4444';

    // Face bounding box
    if (showBoundingBox) {
      elements.push(
        <Rect
          key={`face-bounds-${index}`}
          x={bounds.topLeft.x}
          y={bounds.topLeft.y}
          width={bounds.width}
          height={bounds.height}
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          strokeDasharray="6,3"
          opacity={0.8}
          rx="8"
        />
      );

      // Confidence indicator
      elements.push(
        <Rect
          key={`confidence-${index}`}
          x={bounds.topLeft.x}
          y={bounds.topLeft.y - 25}
          width={bounds.width * face.probability}
          height="4"
          fill={face.probability > 0.8 ? successColor : warningColor}
          opacity={0.9}
          rx="2"
        />
      );
    }

    // Eye status indicators
    if (showEyeStatus && landmarks) {
      // Left eye
      const leftEyeColor = leftEyeOpenProbability > 0.5 ? successColor : errorColor;
      const leftEyeRadius = leftEyeOpenProbability > 0.5 ? 12 : 8;

      elements.push(
        <Circle
          key={`left-eye-${index}`}
          cx={landmarks.leftEye.x}
          cy={landmarks.leftEye.y}
          r={leftEyeRadius}
          fill="none"
          stroke={leftEyeColor}
          strokeWidth="3"
          opacity={0.9}
        />
      );

      // Left eye pupil indicator
      elements.push(
        <Circle
          key={`left-pupil-${index}`}
          cx={landmarks.leftEye.x}
          cy={landmarks.leftEye.y}
          r="3"
          fill={leftEyeColor}
          opacity={leftEyeOpenProbability > 0.5 ? 0.8 : 0.3}
        />
      );

      // Right eye
      const rightEyeColor = rightEyeOpenProbability > 0.5 ? successColor : errorColor;
      const rightEyeRadius = rightEyeOpenProbability > 0.5 ? 12 : 8;

      elements.push(
        <Circle
          key={`right-eye-${index}`}
          cx={landmarks.rightEye.x}
          cy={landmarks.rightEye.y}
          r={rightEyeRadius}
          fill="none"
          stroke={rightEyeColor}
          strokeWidth="3"
          opacity={0.9}
        />
      );

      // Right eye pupil indicator
      elements.push(
        <Circle
          key={`right-pupil-${index}`}
          cx={landmarks.rightEye.x}
          cy={landmarks.rightEye.y}
          r="3"
          fill={rightEyeColor}
          opacity={rightEyeOpenProbability > 0.5 ? 0.8 : 0.3}
        />
      );

      // Eye connection line (for visual reference)
      elements.push(
        <Line
          key={`eye-line-${index}`}
          x1={landmarks.leftEye.x}
          y1={landmarks.leftEye.y}
          x2={landmarks.rightEye.x}
          y2={landmarks.rightEye.y}
          stroke={primaryColor}
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={0.4}
        />
      );
    }

    // Facial landmarks
    if (showLandmarks && landmarks) {
      const landmarkPoints = [
        { key: 'nose', point: landmarks.noseTip, color: primaryColor },
        { key: 'mouth', point: landmarks.mouthCenter, color: primaryColor },
        { key: 'rightEar', point: landmarks.rightEarTragion, color: primaryColor },
        { key: 'leftEar', point: landmarks.leftEarTragion, color: primaryColor },
      ];

      landmarkPoints.forEach(({ key, point, color }) => {
        elements.push(
          <Circle
            key={`${key}-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            opacity={0.7}
          />
        );
      });

      // Face outline (simplified)
      const pathData = [
        `M ${landmarks.leftEarTragion.x} ${landmarks.leftEarTragion.y}`,
        `Q ${landmarks.leftEye.x} ${landmarks.leftEye.y - 20} ${landmarks.noseTip.x} ${landmarks.noseTip.y - 30}`,
        `Q ${landmarks.rightEye.x} ${landmarks.rightEye.y - 20} ${landmarks.rightEarTragion.x} ${landmarks.rightEarTragion.y}`,
        `Q ${landmarks.rightEye.x} ${landmarks.mouthCenter.y + 30} ${landmarks.mouthCenter.x} ${landmarks.mouthCenter.y + 40}`,
        `Q ${landmarks.leftEye.x} ${landmarks.mouthCenter.y + 30} ${landmarks.leftEarTragion.x} ${landmarks.leftEarTragion.y}`
      ].join(' ');

      elements.push(
        <Path
          key={`face-outline-${index}`}
          d={pathData}
          fill="none"
          stroke={primaryColor}
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity={0.3}
        />
      );
    }

    return elements;
  };

  return (
    <View style={styles.overlay}>
      <Svg style={StyleSheet.absoluteFillObject}>
        {faces.map((face, index) => (
          <React.Fragment key={`face-${index}`}>
            {renderFaceDetection(face, index)}
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
