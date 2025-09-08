// Enhanced Face Detection Implementation
// Since expo-face-detector is deprecated, we'll use react-native-ml-kit/face-detection
// or react-native-vision-camera with face detection plugins

// First, install the required packages:
// npm install @react-native-ml-kit/face-detection react-native-vision-camera
// or
// npm install react-native-vision-camera-face-detector

// For Expo managed workflow, you might need to eject or use development builds
// Here's the implementation structure:

// types/face-detection.ts
export interface FaceLandmarks {
  leftEye?: { x: number; y: number };
  rightEye?: { x: number; y: number };
  noseBase?: { x: number; y: number };
  leftMouth?: { x: number; y: number };
  rightMouth?: { x: number; y: number };
  bottomMouth?: { x: number; y: number };
  // Additional landmarks for better tracking
  leftEar?: { x: number; y: number };
  rightEar?: { x: number; y: number };
  leftCheek?: { x: number; y: number };
  rightCheek?: { x: number; y: number };
}

export interface FaceDetectionResult {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  landmarks?: FaceLandmarks;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  smilingProbability?: number;
  trackingID?: number;
  // Additional properties for better tracking
  headEulerAngleX?: number; // Pitch
  headEulerAngleY?: number; // Yaw  
  headEulerAngleZ?: number; // Roll
}

export interface BlinkEvent {
  timestamp: number;
  eye: 'left' | 'right' | 'both';
  duration: number;
}

// Enhanced Blink Detection Logic
export class BlinkDetector {
  private lastLeftEyeState: boolean = true;
  private lastRightEyeState: boolean = true;
  private leftEyeCloseTime: number = 0;
  private rightEyeCloseTime: number = 0;
  private blinkHistory: BlinkEvent[] = [];
  private readonly EYE_CLOSE_THRESHOLD = 0.3;
  private readonly MIN_BLINK_DURATION = 100; // ms
  private readonly MAX_BLINK_DURATION = 400; // ms

  detectBlink(leftEyeProb: number, rightEyeProb: number): BlinkEvent | null {
    const currentTime = Date.now();
    const leftEyeOpen = leftEyeProb > this.EYE_CLOSE_THRESHOLD;
    const rightEyeOpen = rightEyeProb > this.EYE_CLOSE_THRESHOLD;

    let blinkEvent: BlinkEvent | null = null;

    // Detect left eye blink
    if (!leftEyeOpen && this.lastLeftEyeState) {
      // Eye just closed
      this.leftEyeCloseTime = currentTime;
    } else if (leftEyeOpen && !this.lastLeftEyeState && this.leftEyeCloseTime > 0) {
      // Eye just opened
      const duration = currentTime - this.leftEyeCloseTime;
      if (duration >= this.MIN_BLINK_DURATION && duration <= this.MAX_BLINK_DURATION) {
        blinkEvent = {
          timestamp: currentTime,
          eye: 'left',
          duration
        };
      }
      this.leftEyeCloseTime = 0;
    }

    // Detect right eye blink
    if (!rightEyeOpen && this.lastRightEyeState) {
      this.rightEyeCloseTime = currentTime;
    } else if (rightEyeOpen && !this.lastRightEyeState && this.rightEyeCloseTime > 0) {
      const duration = currentTime - this.rightEyeCloseTime;
      if (duration >= this.MIN_BLINK_DURATION && duration <= this.MAX_BLINK_DURATION) {
        // If both eyes blinked around the same time, consider it a single blink
        const timeDiff = Math.abs(this.leftEyeCloseTime - this.rightEyeCloseTime);
        if (timeDiff < 50) { // Both eyes closed within 50ms
          blinkEvent = {
            timestamp: currentTime,
            eye: 'both',
            duration: Math.max(duration, currentTime - this.leftEyeCloseTime)
          };
        } else if (!blinkEvent) {
          blinkEvent = {
            timestamp: currentTime,
            eye: 'right',
            duration
          };
        }
      }
      this.rightEyeCloseTime = 0;
    }

    this.lastLeftEyeState = leftEyeOpen;
    this.lastRightEyeState = rightEyeOpen;

    if (blinkEvent) {
      this.blinkHistory.push(blinkEvent);
      // Keep only last 60 seconds of blinks
      const oneMinuteAgo = currentTime - 60000;
      this.blinkHistory = this.blinkHistory.filter(b => b.timestamp > oneMinuteAgo);
    }

    return blinkEvent;
  }

  getBlinkRate(): number {
    return this.blinkHistory.length;
  }

  getTotalBlinks(): number {
    return this.blinkHistory.length;
  }

  reset(): void {
    this.blinkHistory = [];
    this.lastLeftEyeState = true;
    this.lastRightEyeState = true;
    this.leftEyeCloseTime = 0;
    this.rightEyeCloseTime = 0;
  }
}

// Face Detection Service
export class FaceDetectionService {
  private detector: any; // ML Kit face detector instance
  private isInitialized: boolean = false;

  async initialize() {
    try {
      // For @react-native-ml-kit/face-detection
      const MLKitFaceDetection = require('@react-native-ml-kit/face-detection').default;
      this.detector = await MLKitFaceDetection.create({
        performanceMode: 'fast',
        landmarkMode: 'all',
        classificationMode: 'all',
        minFaceSize: 0.1,
        trackingEnabled: true,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize face detection:', error);
      this.isInitialized = false;
    }
  }

  async detectFaces(imagePath: string): Promise<FaceDetectionResult[]> {
    if (!this.isInitialized || !this.detector) {
      throw new Error('Face detector not initialized');
    }

    try {
      const faces = await this.detector.detect(imagePath);
      return faces.map((face: any) => ({
        bounds: {
          origin: { x: face.frame.left, y: face.frame.top },
          size: {
            width: face.frame.width,
            height: face.frame.height
          }
        },
        landmarks: {
          leftEye: face.landmarks?.leftEye,
          rightEye: face.landmarks?.rightEye,
          noseBase: face.landmarks?.noseBase,
          leftMouth: face.landmarks?.mouthLeft,
          rightMouth: face.landmarks?.mouthRight,
          leftEar: face.landmarks?.leftEar,
          rightEar: face.landmarks?.rightEar,
          leftCheek: face.landmarks?.leftCheek,
          rightCheek: face.landmarks?.rightCheek,
        },
        leftEyeOpenProbability: face.leftEyeOpenProbability,
        rightEyeOpenProbability: face.rightEyeOpenProbability,
        smilingProbability: face.smilingProbability,
        trackingID: face.trackingID,
        headEulerAngleX: face.headEulerAngleX,
        headEulerAngleY: face.headEulerAngleY,
        headEulerAngleZ: face.headEulerAngleZ,
      }));
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  destroy() {
    if (this.detector) {
      this.detector.close?.();
      this.detector = null;
    }
    this.isInitialized = false;
  }
}

// Coordinate Transformation Utilities
export class CoordinateTransformer {
  constructor(
    private cameraWidth: number,
    private cameraHeight: number,
    private screenWidth: number,
    private screenHeight: number,
    private isFrontCamera: boolean = true
  ) { }

  transformFaceCoordinates(face: FaceDetectionResult): FaceDetectionResult {
    const scaleX = this.screenWidth / this.cameraWidth;
    const scaleY = this.screenHeight / this.cameraHeight;

    // For front camera, we need to flip horizontally
    const flipX = this.isFrontCamera;

    return {
      ...face,
      bounds: {
        origin: {
          x: flipX ?
            this.screenWidth - (face.bounds.origin.x + face.bounds.size.width) * scaleX :
            face.bounds.origin.x * scaleX,
          y: face.bounds.origin.y * scaleY
        },
        size: {
          width: face.bounds.size.width * scaleX,
          height: face.bounds.size.height * scaleY
        }
      },
      landmarks: face.landmarks ? {
        leftEye: face.landmarks.leftEye ? {
          x: flipX ?
            this.screenWidth - face.landmarks.leftEye.x * scaleX :
            face.landmarks.leftEye.x * scaleX,
          y: face.landmarks.leftEye.y * scaleY
        } : undefined,
        rightEye: face.landmarks.rightEye ? {
          x: flipX ?
            this.screenWidth - face.landmarks.rightEye.x * scaleX :
            face.landmarks.rightEye.x * scaleX,
          y: face.landmarks.rightEye.y * scaleY
        } : undefined,
        noseBase: face.landmarks.noseBase ? {
          x: flipX ?
            this.screenWidth - face.landmarks.noseBase.x * scaleX :
            face.landmarks.noseBase.x * scaleX,
          y: face.landmarks.noseBase.y * scaleY
        } : undefined,
        leftMouth: face.landmarks.leftMouth ? {
          x: flipX ?
            this.screenWidth - face.landmarks.leftMouth.x * scaleX :
            face.landmarks.leftMouth.x * scaleX,
          y: face.landmarks.leftMouth.y * scaleY
        } : undefined,
        rightMouth: face.landmarks.rightMouth ? {
          x: flipX ?
            this.screenWidth - face.landmarks.rightMouth.x * scaleX :
            face.landmarks.rightMouth.x * scaleX,
          y: face.landmarks.rightMouth.y * scaleY
        } : undefined,
      } : undefined
    };
  }
}

// Usage in your component:
/*
import { FaceDetectionService, BlinkDetector, CoordinateTransformer } from './face-detection-service';

const faceDetectionService = new FaceDetectionService();
const blinkDetector = new BlinkDetector();
const coordinateTransformer = new CoordinateTransformer(640, 480, screenWidth, 200);

// Initialize face detection
useEffect(() => {
  faceDetectionService.initialize();
  
  return () => {
    faceDetectionService.destroy();
  };
}, []);

// Process camera frames
const processCameraFrame = async (frame) => {
  try {
    const faces = await faceDetectionService.detectFaces(frame.path);
    const transformedFaces = faces.map(face => 
      coordinateTransformer.transformFaceCoordinates(face)
    );
    
    setFaces(transformedFaces);
    
    if (transformedFaces.length > 0) {
      const face = transformedFaces[0];
      const blinkEvent = blinkDetector.detectBlink(
        face.leftEyeOpenProbability || 1,
        face.rightEyeOpenProbability || 1
      );
      
      if (blinkEvent) {
        setTotalBlinks(blinkDetector.getTotalBlinks());
        setBlinkRate(blinkDetector.getBlinkRate());
      }
    }
  } catch (error) {
    console.error('Frame processing error:', error);
  }
};
*/
