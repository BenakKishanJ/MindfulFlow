// services/faceDetectionService.ts
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';
import { FaceDetectionResult, Point, BlinkData } from '@/types/face-detection';

export class FaceDetectionService {
  private model: blazeface.BlazeFaceModel | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      // Wait for TensorFlow to be ready
      await tf.ready();

      // Load BlazeFace model
      this.model = await blazeface.load();
      this.isInitialized = true;

      console.log('BlazeFace model loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize face detection:', error);
      return false;
    }
  }

  async detectFaces(imageData: tf.Tensor3D): Promise<FaceDetectionResult[]> {
    if (!this.model || !this.isInitialized) {
      throw new Error('Face detection service not initialized');
    }

    try {
      const predictions = await this.model.estimateFaces(imageData, false);

      return predictions.map((prediction: any) => {
        const landmarks = prediction.landmarks as number[][];

        // BlazeFace provides 6 keypoints:
        // 0: right eye, 1: left eye, 2: nose tip, 3: mouth center, 4: right ear tragion, 5: left ear tragion
        const rightEye: Point = { x: landmarks[0][0], y: landmarks[0][1] };
        const leftEye: Point = { x: landmarks[1][0], y: landmarks[1][1] };
        const noseTip: Point = { x: landmarks[2][0], y: landmarks[2][1] };
        const mouthCenter: Point = { x: landmarks[3][0], y: landmarks[3][1] };
        const rightEarTragion: Point = { x: landmarks[4][0], y: landmarks[4][1] };
        const leftEarTragion: Point = { x: landmarks[5][0], y: landmarks[5][1] };

        // Calculate bounding box
        const topLeft: Point = {
          x: prediction.topLeft[0],
          y: prediction.topLeft[1]
        };
        const bottomRight: Point = {
          x: prediction.bottomRight[0],
          y: prediction.bottomRight[1]
        };

        // Estimate eye openness based on eye aspect ratio (EAR)
        const leftEyeOpenProbability = this.calculateEyeOpenProbability(
          leftEye, leftEarTragion, noseTip
        );
        const rightEyeOpenProbability = this.calculateEyeOpenProbability(
          rightEye, rightEarTragion, noseTip
        );

        return {
          bounds: {
            topLeft,
            bottomRight,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
          },
          landmarks: {
            rightEye,
            leftEye,
            noseTip,
            mouthCenter,
            rightEarTragion,
            leftEarTragion
          },
          probability: prediction.probability?.[0] || 0.9,
          leftEyeOpenProbability,
          rightEyeOpenProbability
        };
      });
    } catch (error) {
      console.error('Error detecting faces:', error);
      return [];
    }
  }

  private calculateEyeOpenProbability(
    eyePoint: Point,
    earPoint: Point,
    nosePoint: Point
  ): number {
    // Calculate eye aspect ratio based on relative positions
    // This is a simplified approach - in production, you might want to use more sophisticated methods

    // Distance from eye to ear (horizontal reference)
    const eyeToEar = Math.sqrt(
      Math.pow(eyePoint.x - earPoint.x, 2) +
      Math.pow(eyePoint.y - earPoint.y, 2)
    );

    // Distance from eye to nose (vertical reference)
    const eyeToNose = Math.sqrt(
      Math.pow(eyePoint.x - nosePoint.x, 2) +
      Math.pow(eyePoint.y - nosePoint.y, 2)
    );

    // Eye aspect ratio approximation
    const ratio = eyeToNose / (eyeToEar + 0.1); // Add small value to prevent division by zero

    // Normalize to probability (0-1)
    // These thresholds may need adjustment based on testing
    const openThreshold = 0.5;
    const closedThreshold = 0.3;

    if (ratio > openThreshold) {
      return Math.min(1.0, (ratio - closedThreshold) / (openThreshold - closedThreshold));
    } else {
      return Math.max(0.0, (ratio - closedThreshold) / (openThreshold - closedThreshold));
    }
  }

  processImageTensor(imageUri: string, width: number, height: number): Promise<tf.Tensor3D> {
    return new Promise((resolve, reject) => {
      try {
        // Create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to tensor
          const imageData = ctx.getImageData(0, 0, width, height);
          const tensor = tf.browser.fromPixels(imageData);
          resolve(tensor);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUri;
      } catch (error) {
        reject(error);
      }
    });
  }

  dispose() {
    if (this.model) {
      // BlazeFace models don't have a direct dispose method
      // but TensorFlow tensors should be cleaned up automatically
      this.model = null;
    }
    this.isInitialized = false;
  }
}

export class BlinkDetectionService {
  private blinkHistory: BlinkData[] = [];
  private lastEyeStates: { left: boolean; right: boolean } = { left: true, right: true };
  private eyeClosureThreshold = 0.4; // Threshold for considering eye as closed
  private blinkDurationMs = 150; // Minimum blink duration
  private maxHistoryMs = 60000; // Keep 1 minute of history

  detectBlink(leftEyeOpenProb: number, rightEyeOpenProb: number): {
    leftBlink: boolean;
    rightBlink: boolean;
    anyBlink: boolean;
  } {
    const currentTime = Date.now();
    const leftEyeOpen = leftEyeOpenProb > this.eyeClosureThreshold;
    const rightEyeOpen = rightEyeOpenProb > this.eyeClosureThreshold;

    // Detect blink: eye was open and now closed
    const leftBlink = this.lastEyeStates.left && !leftEyeOpen;
    const rightBlink = this.lastEyeStates.right && !rightEyeOpen;
    const anyBlink = leftBlink || rightBlink;

    // Update eye states
    this.lastEyeStates = { left: leftEyeOpen, right: rightEyeOpen };

    // Record blink data
    if (anyBlink) {
      this.blinkHistory.push({
        timestamp: currentTime,
        leftEyeOpen,
        rightEyeOpen
      });

      // Clean old data
      this.cleanHistory(currentTime);
    }

    return { leftBlink, rightBlink, anyBlink };
  }

  private cleanHistory(currentTime: number) {
    this.blinkHistory = this.blinkHistory.filter(
      data => currentTime - data.timestamp < this.maxHistoryMs
    );
  }

  calculateBlinkRate(): number {
    if (this.blinkHistory.length === 0) return 0;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentBlinks = this.blinkHistory.filter(
      blink => blink.timestamp > oneMinuteAgo
    );

    return recentBlinks.length;
  }

  getTotalBlinks(): number {
    return this.blinkHistory.length;
  }

  getBlinkStats() {
    const blinkRate = this.calculateBlinkRate();
    const totalBlinks = this.getTotalBlinks();

    // Calculate separate eye blinks
    const leftEyeBlinks = this.blinkHistory.filter(b => !b.leftEyeOpen).length;
    const rightEyeBlinks = this.blinkHistory.filter(b => !b.rightEyeOpen).length;

    return {
      blinkRate,
      totalBlinks,
      leftEyeBlinks,
      rightEyeBlinks,
      averageBlinkDuration: this.blinkDurationMs
    };
  }

  reset() {
    this.blinkHistory = [];
    this.lastEyeStates = { left: true, right: true };
  }
}
