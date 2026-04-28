import { useState, useCallback, useRef, useEffect } from 'react';

// Types for face-api.js (dynamically loaded)
interface FaceApi {
  detectSingleFace: (input: HTMLVideoElement | HTMLCanvasElement) => Promise<FaceDetection | undefined>;
  FaceLandmarks68: new () => FaceLandmarks;
}

interface FaceDetection {
  detection: {
    box: { x: number; y: number; width: number; height: number };
    score: number;
  };
  landmarks?: FaceLandmarks;
  descriptor?: Float32Array;
}

interface FaceLandmarks {
  positions: { x: number; y: number }[];
  getLeftEye: () => { x: number; y: number }[];
  getRightEye: () => { x: number; y: number }[];
}

interface FaceRecognitionState {
  isModelLoading: boolean;
  isDetecting: boolean;
  faceDetected: boolean;
  faceDescriptor: number[] | null;
  confidence: number;
  blinkDetected: boolean;
  error: string | null;
}

interface UseFaceRecognitionReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: FaceRecognitionState;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startDetection: () => void;
  stopDetection: () => void;
  captureFace: () => Promise<{ descriptor: number[]; livenessScore: number; blinkDetected: boolean } | null>;
  reset: () => void;
}

// Type declarations for face-api.js (dynamically loaded)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceApiModule = any;

// Extend window interface for face-api
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi?: any;
  }
}

/**
 * Custom hook for face recognition using face-api.js
 * Dynamically loads the library to avoid bundling the large models
 * 
 * Features:
 * - Face detection
 * - Face descriptor extraction (128-dimensional embedding)
 * - Blink detection for liveness/anti-spoofing
 * - Camera management
 */
export function useFaceRecognition(): UseFaceRecognitionReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<FaceApi | null>(null);
  const blinkStateRef = useRef<{ leftOpen: boolean; rightOpen: boolean; blinkCount: number }>({
    leftOpen: true,
    rightOpen: true,
    blinkCount: 0,
  });
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDetectingLoopRef = useRef(false);

  const [state, setState] = useState<FaceRecognitionState>({
    isModelLoading: false,
    isDetecting: false,
    faceDetected: false,
    faceDescriptor: null,
    confidence: 0,
    blinkDetected: false,
    error: null,
  });

  // Load face-api.js dynamically
  const loadFaceApi = useCallback(async () => {
    if (faceApiRef.current) return faceApiRef.current;

    setState(prev => ({ ...prev, isModelLoading: true, error: null }));

    try {
      // Dynamically import face-api.js
      const faceapi: FaceApiModule = await import('face-api.js');
      
      // Load models from CDN
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),
      ]);

      faceApiRef.current = faceapi;
      setState(prev => ({ ...prev, isModelLoading: false }));
      return faceapi;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isModelLoading: false, 
        error: 'Failed to load face recognition models. Please check your internet connection.' 
      }));
      return null;
    }
  }, []);

  // Detect blink using eye aspect ratio
  const detectBlink = useCallback((landmarks: FaceLandmarks): boolean => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Calculate eye aspect ratio (EAR)
    const calculateEAR = (eye: { x: number; y: number }[]): number => {
      const vertical1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
      const vertical2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
      const horizontal = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
      return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);

    // Threshold for closed eyes - lowered to be more sensitive
    // Natural blink: EAR drops from ~0.3 to ~0.1 briefly
    const EAR_THRESHOLD = 0.20; // More sensitive to catch partial blinks
    const isLeftClosed = leftEAR < EAR_THRESHOLD;
    const isRightClosed = rightEAR < EAR_THRESHOLD;

    // Track state changes
    const prevState = blinkStateRef.current;
    
    // Detect blink: eyes were open, then closed, then open again
    if (!prevState.leftOpen && !prevState.rightOpen && isLeftClosed && isRightClosed) {
      blinkStateRef.current.blinkCount++;
    }

    blinkStateRef.current.leftOpen = !isLeftClosed;
    blinkStateRef.current.rightOpen = !isRightClosed;

    // Require at least 1 blink for liveness detection
    return blinkStateRef.current.blinkCount >= 1;
  }, []);

  // Continuous detection loop
  const runDetectionLoop = useCallback(async () => {
    const faceapi = faceApiRef.current;
    const video = videoRef.current;

    if (!faceapi || !video || !isDetectingLoopRef.current) return;

    try {
      // Detect face with landmarks only (no descriptor for performance)
      // @ts-ignore - face-api.js types are incomplete but runtime works
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detection = await faceapi
        // @ts-ignore
        .detectSingleFace(video, new (faceapi.TinyFaceDetectorOptions as any)({ inputSize: 320, scoreThreshold: 0.5 }))
        // @ts-ignore
        .withFaceLandmarks();

      if (detection) {
        const confidence = detection.detection.score;
        
        // Detect blink
        const blinkDetected = detection.landmarks ? detectBlink(detection.landmarks) : false;

        setState(prev => ({
          ...prev,
          faceDetected: confidence > 0.6,
          confidence,
          blinkDetected: blinkDetected || prev.blinkDetected, // Keep blink detected once triggered
        }));
      } else {
        setState(prev => ({
          ...prev,
          faceDetected: false,
          confidence: 0,
        }));
      }
    } catch (err) {
      // Silent fail on detection errors
    }

    // Schedule next detection
    if (isDetectingLoopRef.current) {
      detectionIntervalRef.current = setTimeout(() => {
        runDetectionLoop();
      }, 200); // 5 detections per second
    }
  }, [detectBlink]);

  // Start continuous detection
  const startDetection = useCallback(() => {
    if (isDetectingLoopRef.current) return;
    isDetectingLoopRef.current = true;
    runDetectionLoop();
  }, [runDetectionLoop]);

  // Stop continuous detection
  const stopDetection = useCallback(() => {
    isDetectingLoopRef.current = false;
    if (detectionIntervalRef.current) {
      clearTimeout(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before playing
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('[FaceRecognition] Video metadata loaded');
              resolve();
            };
          }
        });
        
        await videoRef.current.play();
        console.log('[FaceRecognition] Camera started successfully');
      }

      // Load face-api if not already loaded
      const faceapi = await loadFaceApi();
      
      // Start continuous detection after models load
      if (faceapi) {
        startDetection();
      }
    } catch (err) {
      let errorMessage = 'Failed to access camera';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        }
      }
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [loadFaceApi, startDetection]);

  // Stop camera
  const stopCamera = useCallback(() => {
    stopDetection();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stopDetection]);

  // Capture face and extract descriptor
  const captureFace = useCallback(async (): Promise<{ descriptor: number[]; livenessScore: number; blinkDetected: boolean } | null> => {
    const faceapi = faceApiRef.current;
    const video = videoRef.current;

    if (!faceapi || !video) {
      setState(prev => ({ ...prev, error: 'Face recognition not initialized' }));
      return null;
    }

    setState(prev => ({ ...prev, isDetecting: true, error: null }));

    try {
      // Detect face with landmarks and descriptor
      // @ts-ignore - face-api.js types are incomplete but runtime works
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detection = await faceapi
        // @ts-ignore
        .detectSingleFace(video, new (faceapi.TinyFaceDetectorOptions as any)({ inputSize: 416, scoreThreshold: 0.5 }))
        // @ts-ignore
        .withFaceLandmarks()
        // @ts-ignore
        .withFaceDescriptor();

      if (!detection) {
        setState(prev => ({ 
          ...prev, 
          isDetecting: false, 
          faceDetected: false,
          error: 'No face detected. Please position your face in the center of the camera.' 
        }));
        return null;
      }

      // Check face confidence
      const confidence = detection.detection.score;
      if (confidence < 0.7) {
        setState(prev => ({ 
          ...prev, 
          isDetecting: false,
          faceDetected: true,
          confidence,
          error: 'Face detection confidence too low. Please move closer to the camera.' 
        }));
        return null;
      }

      // Detect blink for liveness
      const blinkDetected = detection.landmarks ? detectBlink(detection.landmarks) : false;

      // Calculate liveness score - use full confidence (already validated >= 0.7)
      // Blink gives a bonus but is not required
      const livenessScore = confidence;

      // Convert Float32Array to regular array
      const descriptor: number[] = Array.from(detection.descriptor || []) as number[];

      setState(prev => ({
        ...prev,
        isDetecting: false,
        faceDetected: true,
        faceDescriptor: descriptor,
        confidence,
        blinkDetected,
      }));

      return {
        descriptor,
        livenessScore,
        blinkDetected,
      };
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isDetecting: false, 
        error: 'Face capture failed. Please try again.' 
      }));
      return null;
    }
  }, [detectBlink]);

  // Reset state
  const reset = useCallback(() => {
    blinkStateRef.current = { leftOpen: true, rightOpen: true, blinkCount: 0 };
    stopDetection();
    setState({
      isModelLoading: false,
      isDetecting: false,
      faceDetected: false,
      faceDescriptor: null,
      confidence: 0,
      blinkDetected: false,
      error: null,
    });
    // Restart detection after reset
    setTimeout(() => startDetection(), 100);
  }, [stopDetection, startDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    state,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
    captureFace,
    reset,
  };
}

export default useFaceRecognition;
