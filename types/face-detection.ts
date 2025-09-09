// types/face-detection.ts
export interface Point {
  x: number;
  y: number;
}

export interface FaceBounds {
  topLeft: Point;
  bottomRight: Point;
  width: number;
  height: number;
}

export interface FaceLandmarks {
  rightEye: Point;
  leftEye: Point;
  noseTip: Point;
  mouthCenter: Point;
  rightEarTragion: Point;
  leftEarTragion: Point;
}

export interface FaceDetectionResult {
  bounds: FaceBounds;
  landmarks: FaceLandmarks;
  probability: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

export interface BlinkData {
  timestamp: number;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
}

export interface BlinkStats {
  blinkRate: number; // blinks per minute
  totalBlinks: number;
  sessionTime: number;
  leftEyeBlinks: number;
  rightEyeBlinks: number;
  averageBlinkDuration: number;
}
