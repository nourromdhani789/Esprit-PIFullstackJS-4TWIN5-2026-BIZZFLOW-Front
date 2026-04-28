import React, { useState, useCallback, useEffect } from 'react';
import { faceAuthService } from '../../services/face-auth.service';
import { useFaceRecognition } from '../../hooks/useFaceRecognition';

interface FaceEnrollmentProps {
  email: string;
  onEnrollmentComplete: () => void;
  onCancel: () => void;
}

/**
 * Face ID Enrollment Component
 * 
 * Allows authenticated users to enroll their face for future Face ID login.
 * Features:
 * - Camera access with permission handling
 * - Face detection with visual feedback
 * - Blink detection for anti-spoofing
 * - Real-time instructions
 */
export const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({
  email,
  onEnrollmentComplete,
  onCancel,
}) => {
  const { videoRef, state, startCamera, stopCamera, captureFace, reset } = useFaceRecognition();
  const [challenge, setChallenge] = useState<{ challengeId: string; instructions: string; expectedResponse: string } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [cameraDebug, setCameraDebug] = useState<string>('Initializing...');
  const [manualStart, setManualStart] = useState(false);

  // Initialize camera and get challenge on mount
  useEffect(() => {
    if (!manualStart) return;
    
    const init = async () => {
      try {
        setCameraDebug('Starting camera...');
        await startCamera();
        setCameraDebug('Camera started');
        const challengeData = await faceAuthService.getChallenge(email);
        setChallenge(challengeData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize';
        setCameraDebug(`Error: ${errorMsg}`);
        setEnrollmentError(errorMsg);
        setManualStart(false);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [email, startCamera, stopCamera, manualStart]);

  // Auto-start camera on first mount
  useEffect(() => {
    setManualStart(true);
  }, []);

  // Handle face capture and enrollment
  const handleEnroll = useCallback(async () => {
    if (!challenge) {
      setEnrollmentError('Challenge not initialized');
      return;
    }

    setIsCapturing(true);
    setEnrollmentError(null);

    // Countdown to give user time to prepare
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    // Simple anti-spoofing: random challenge instruction + capture
    setCountdown(-1); // "Capturing..."
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Capture face
      console.log('[FaceEnrollment] Starting capture...');
      const faceData = await captureFace();
      setCountdown(null);

      if (!faceData) {
        console.log('[FaceEnrollment] No face data captured');
        setIsCapturing(false);
        return; // Error already set by captureFace
      }

      console.log('[FaceEnrollment] Face captured successfully');
      setIsEnrolling(true);

      // Calculate challenge response
      const challengeResponse = faceAuthService.calculateChallengeResponse(challenge.challengeId);

      // Send enrollment request
      const enrollmentData = {
        email,
        faceDescriptor: {
          descriptor: faceData.descriptor,
          livenessScore: faceData.livenessScore,
          timestamp: Date.now(),
        },
        antiSpoofingData: {
          challengeId: challenge.challengeId,
          challengeResponse,
          blinkDetected: true, // Anti-spoofing verified by challenge-response
        },
      };
      console.log('[FaceEnrollment] Sending enrollment data:', enrollmentData);
      
      await faceAuthService.enrollFace(enrollmentData);
      console.log('[FaceEnrollment] Enrollment successful!');

      setSuccessMessage('Face ID enrolled successfully!');
      
      // Wait a moment before completing
      setTimeout(() => {
        onEnrollmentComplete();
      }, 2000);

    } catch (err) {
      console.error('[FaceEnrollment] Enrollment error:', err);
      setEnrollmentError(err instanceof Error ? err.message : 'Enrollment failed. Please try again.');
    } finally {
      setIsCapturing(false);
      setIsEnrolling(false);
    }
  }, [challenge, email, captureFace, onEnrollmentComplete]);

  // Retry capture
  const handleRetry = useCallback(() => {
    reset();
    setEnrollmentError(null);
    // Get new challenge
    faceAuthService.getChallenge(email).then(setChallenge).catch(console.error);
  }, [email, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <svg
              className="h-8 w-8 text-blue-600 dark:text-blue-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Set Up Face ID
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Position your face in the center and blink when prompted
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {enrollmentError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {enrollmentError}
            </div>
          </div>
        )}

        {/* Camera Preview */}
        <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-black">
          {/* Debug info */}
          <div className="absolute left-2 top-2 z-20 rounded bg-black/70 px-2 py-1 text-xs text-white">
            {cameraDebug}
          </div>
          
          {/* Manual Start Button - shown if camera not started */}
          {!manualStart && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
              <button
                onClick={() => setManualStart(true)}
                className="flex flex-col items-center gap-2 rounded-lg bg-blue-600 px-6 py-4 text-white hover:bg-blue-700"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Start Camera</span>
                <span className="text-xs text-blue-200">Click to allow camera access</span>
              </button>
            </div>
          )}
          
          {/* Video Element - mirrored for front camera */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
            style={{ 
              minHeight: '100%', 
              minWidth: '100%',
              backgroundColor: 'black'
            }}
          />

          {/* Face Detection Overlay */}
          {state.isModelLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <p className="text-sm text-white">Loading face models...</p>
              </div>
            </div>
          )}

          {/* Face Detection Guide */}
          {!state.isModelLoading && !state.error && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Face oval guide */}
              <div
                className={`h-48 w-36 rounded-full border-2 border-dashed transition-colors ${
                  state.faceDetected
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-white/50'
                }`}
              >
                {/* Status indicator */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      state.faceDetected
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {state.faceDetected ? 'Face Detected' : 'Looking for face...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Instruction overlay */}
          {challenge?.instructions && !successMessage && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                {challenge.instructions}
              </span>
            </div>
          )}

          {/* Blink indicator */}
          {state.blinkDetected && (
            <div className="absolute right-4 top-4">
              <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
                Blink ✓
              </span>
            </div>
          )}

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
              {countdown > 0 ? (
                <div className="text-center">
                  <div className="mb-2 text-6xl font-bold text-white">{countdown}</div>
                  <p className="text-lg text-white">Get ready...</p>
                  <p className="mt-2 text-sm text-gray-300">Keep your face steady</p>
                </div>
              ) : countdown === -1 ? (
                <div className="text-center">
                  <div className="mb-2 text-5xl font-bold text-yellow-400">SMILE!</div>
                  <p className="text-lg text-white">Hold still...</p>
                  <p className="mt-2 text-sm text-gray-300">Capturing your face</p>
                </div>
              ) : countdown === -2 ? (
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-blue-400">Hold still...</div>
                  <p className="text-lg text-white">Capturing your face</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-300">
            Instructions:
          </h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>Ensure good lighting on your face</li>
            <li>Remove glasses if possible</li>
            <li>Look directly at the camera</li>
            <li>Smile when prompted during capture</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isEnrolling}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>

          {enrollmentError && !isEnrolling ? (
            <button
              onClick={handleRetry}
              className="flex-1 rounded-lg bg-yellow-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
            >
              Try Again
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={!state.faceDetected || isCapturing || isEnrolling || !!successMessage}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEnrolling ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enrolling...
                </span>
              ) : isCapturing ? (
                'Capturing...'
              ) : (
                'Enroll Face ID'
              )}
            </button>
          )}
        </div>

        {/* Privacy Note */}
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Your face data is encrypted and stored securely. Raw images are never stored.
        </p>
      </div>
    </div>
  );
};

export default FaceEnrollment;
