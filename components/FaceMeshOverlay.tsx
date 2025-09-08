// components/FaceMeshOverlay.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Path, Line, Ellipse } from 'react-native-svg';
import { FaceDetectionResult } from '@/types/face-detection';

interface FaceMeshOverlayProps {
  faces: FaceDetectionResult[];
  containerWidth: number;
  containerHeight: number;
}

const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  faces,
  containerWidth,
  containerHeight
}) => {
  if (!faces || faces.length === 0) {
    return null;
  }

  const renderFaceDetection = (face: FaceDetectionResult, index: number) => {
    const {
      bounds,
      landmarks,
      leftEyeOpenProbability = 1,
      rightEyeOpenProbability = 1,
      headEulerAngleX = 0,
      headEulerAngleY = 0,
      headEulerAngleZ = 0
    } = face;

    const elements = [];
    const faceColor = '#8B5CF6';
    const eyeOpenColor = '#22c55e';
    const eyeClosedColor = '#ef4444';

    // Face bounding box with rounded corners
    const faceX = bounds.origin.x;
    const faceY = bounds.origin.y;
    const faceWidth = bounds.size.width;
    const faceHeight = bounds.size.height;

    // Calculate face center for rotation
    const faceCenterX = faceX + faceWidth / 2;
    const faceCenterY = faceY + faceHeight / 2;

    // Face bounding box
    elements.push(
      <Rect
        key={`face-bounds-${index}`}
        x={faceX}
        y={faceY}
        width={faceWidth}
        height={faceHeight}
        fill="none"
        stroke={faceColor}
        strokeWidth="2"
        strokeDasharray="8,4"
        opacity={0.8}
        rx="8"
        ry="8"
      />
    );

    // Face center point
    elements.push(
      <Circle
        key={`face-center-${index}`}
        cx={faceCenterX}
        cy={faceCenterY}
        r={3}
        fill={faceColor}
        opacity={0.6}
      />
    );

    // Head orientation indicators
    if (Math.abs(headEulerAngleX) > 10 || Math.abs(headEulerAngleY) > 10 || Math.abs(headEulerAngleZ) > 10) {
      // Draw orientation lines
      const lineLength = 40;
      const angleRadX = (headEulerAngleX * Math.PI) / 180;
      const angleRadY = (headEulerAngleY * Math.PI) / 180;
      const angleRadZ = (headEulerAngleZ * Math.PI) / 180;

      // Pitch line (up/down)
      elements.push(
        <Line
          key={`pitch-line-${index}`}
          x1={faceCenterX}
          y1={faceCenterY}
          x2={faceCenterX}
          y2={faceCenterY - lineLength * Math.cos(angleRadX)}
          stroke="#f59e0b"
          strokeWidth="2"
          opacity={0.7}
        />
      );

      // Yaw line (left/right)
      elements.push(
        <Line
          key={`yaw-line-${index}`}
          x1={faceCenterX}
          y1={faceCenterY}
          x2={faceCenterX + lineLength * Math.sin(angleRadY)}
          y2={faceCenterY}
          stroke="#ef4444"
          strokeWidth="2"
          opacity={0.7}
        />
      );
    }

    if (landmarks) {
      // Enhanced eye detection with animation
      if (landmarks.leftEye) {
        const leftEyeColor = leftEyeOpenProbability > 0.5 ? eyeOpenColor : eyeClosedColor;
        const eyeSize = leftEyeOpenProbability > 0.5 ? 12 : 8;

        elements.push(
          <Circle
            key={`left-eye-${index}`}
            cx={landmarks.leftEye.x}
            cy={landmarks.leftEye.y}
            r={eyeSize}
            fill="none"
            stroke={leftEyeColor}
            strokeWidth="3"
            opacity={0.9}
          />
        );

        // Eye inner circle for open/closed state
        elements.push(
          <Circle
            key={`left-eye-inner-${index}`}
            cx={landmarks.leftEye.x}
            cy={landmarks.leftEye.y}
            r={4}
            fill={leftEyeColor}
            opacity={leftEyeOpenProbability}
          />
        );
      }

      if (landmarks.rightEye) {
        const rightEyeColor = rightEyeOpenProbability > 0.5 ? eyeOpenColor : eyeClosedColor;
        const eyeSize = rightEyeOpenProbability > 0.5 ? 12 : 8;

        elements.push(
          <Circle
            key={`right-eye-${index}`}
            cx={landmarks.rightEye.x}
            cy={landmarks.rightEye.y}
            r={eyeSize}
            fill="none"
            stroke={rightEyeColor}
            strokeWidth="3"
            opacity={0.9}
          />
        );

        elements.push(
          <Circle
            key={`right-eye-inner-${index}`}
            cx={landmarks.rightEye.x}
            cy={landmarks.rightEye.y}
            r={4}
            fill={rightEyeColor}
            opacity={rightEyeOpenProbability}
          />
        );
      }

      // Enhanced nose detection
      if (landmarks.noseBase) {
        elements.push(
          <Circle
            key={`nose-${index}`}
            cx={landmarks.noseBase.x}
            cy={landmarks.noseBase.y}
            r={6}
            fill={faceColor}
            opacity={0.8}
          />
        );

        // Nose bridge indicator
        elements.push(
          <Line
            key={`nose-bridge-${index}`}
            x1={landmarks.noseBase.x}
            y1={landmarks.noseBase.y - 15}
            x2={landmarks.noseBase.x}
            y2={landmarks.noseBase.y + 5}
            stroke={faceColor}
            strokeWidth="2"
            opacity={0.6}
          />
        );
      }

      // Enhanced mouth detection
      if (landmarks.leftMouth && landmarks.rightMouth) {
        const mouthCenterX = (landmarks.leftMouth.x + landmarks.rightMouth.x) / 2;
        const mouthCenterY = (landmarks.leftMouth.y + landmarks.rightMouth.y) / 2;
        const mouthWidth = Math.abs(landmarks.rightMouth.x - landmarks.leftMouth.x);

        // Mouth ellipse
        elements.push(
          <Ellipse
            key={`mouth-${index}`}
            cx={mouthCenterX}
            cy={mouthCenterY}
            rx={mouthWidth / 2}
            ry={6}
            fill="none"
            stroke={faceColor}
            strokeWidth="2"
            opacity={0.8}
          />
        );

        // Mouth corners
        elements.push(
          <Circle
            key={`left-mouth-${index}`}
            cx={landmarks.leftMouth.x}
            cy={landmarks.leftMouth.y}
            r={4}
            fill={faceColor}
            opacity={0.7}
          />
        );

        elements.push(
          <Circle
            key={`right-mouth-${index}`}
            cx={landmarks.rightMouth.x}
            cy={landmarks.rightMouth.y}
            r={4}
            fill={faceColor}
            opacity={0.7}
          />
        );
      }

      // Additional landmarks if available
      if (landmarks.leftEar) {
        elements.push(
          <Circle
            key={`left-ear-${index}`}
            cx={landmarks.leftEar.x}
            cy={landmarks.leftEar.y}
            r={5}
            fill="none"
            stroke={faceColor}
            strokeWidth="2"
            opacity={0.6}
          />
        );
      }

      if (landmarks.rightEar) {
        elements.push(
          <Circle
            key={`right-ear-${index}`}
            cx={landmarks.rightEar.x}
            cy={landmarks.rightEar.y}
            r={5}
            fill="none"
            stroke={faceColor}
            strokeWidth="2"
            opacity={0.6}
          />
        );
      }

      // Face mesh connections (if we have enough landmarks)
      if (landmarks.leftEye && landmarks.rightEye && landmarks.noseBase) {
        // Eye-to-eye line
        elements.push(
          <Line
            key={`eye-line-${index}`}
            x1={landmarks.leftEye.x}
            y1={landmarks.leftEye.y}
            x2={landmarks.rightEye.x}
            y2={landmarks.rightEye.y}
            stroke={faceColor}
            strokeWidth="1"
            strokeDasharray="4,2"
            opacity={0.4}
          />
        );

        // Eye-to-nose lines
        elements.push(
          <Line
            key={`left-eye-nose-${index}`}
            x1={landmarks.leftEye.x}
            y1={landmarks.leftEye.y}
            x2={landmarks.noseBase.x}
            y2={landmarks.noseBase.y}
            stroke={faceColor}
            strokeWidth="1"
            strokeDasharray="4,2"
            opacity={0.3}
          />
        );

        elements.push(
          <Line
            key={`right-eye-nose-${index}`}
            x1={landmarks.rightEye.x}
            y1={landmarks.rightEye.y}
            x2={landmarks.noseBase.x}
            y2={landmarks.noseBase.y}
            stroke={faceColor}
            strokeWidth="1"
            strokeDasharray="4,2"
            opacity={0.3}
          />
        );
      }
    }

    // Face quality indicators
    const faceSize = Math.min(faceWidth, faceHeight);
    const minFaceSize = Math.min(containerWidth, containerHeight) * 0.2;
    const maxFaceSize = Math.min(containerWidth, containerHeight) * 0.8;

    let qualityColor = '#22c55e'; // Good
    if (faceSize < minFaceSize) {
      qualityColor = '#ef4444'; // Too small
    } else if (faceSize > maxFaceSize) {
      qualityColor = '#f59e0b'; // Too large
    }

    // Quality indicator circle
    elements.push(
      <Circle
        key={`quality-indicator-${index}`}
        cx={faceX + faceWidth + 10}
        cy={faceY + 10}
        r={6}
        fill={qualityColor}
        opacity={0.8}
      />
    );

    return elements;
  };

  return (
    <View style={styles.overlay}>
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={containerWidth}
        height={containerHeight}
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      >
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
    pointerEvents: 'none',
  },
});

export default FaceMeshOverlay;
