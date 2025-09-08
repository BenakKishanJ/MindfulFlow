export interface FaceLandmarks {
  leftEye?: { x: number; y: number };
  rightEye?: { x: number; y: number };
  noseBase?: { x: number; y: number };
  leftMouth?: { x: number; y: number };
  rightMouth?: { x: number; y: number };
  bottomMouth?: { x: number; y: number };
}

export interface FaceDetectionResult {
  bounds: {
    origin: {
      x: number;
      y: number;
    };
    size: {
      width: number;
      height: number;
    };
  };
  landmarks?: FaceLandmarks;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  smilingProbability?: number;
  trackingID?: number;
}
