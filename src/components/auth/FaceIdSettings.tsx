import React, { useState, useEffect, useCallback } from 'react';
import { faceAuthService, type FaceEnrollmentStatus } from '../../services/face-auth.service';
import { FaceEnrollment } from './FaceEnrollment';
import { useAuth } from '../../context/AuthContext';

/**
 * Face ID Settings Component
 * 
 * Allows users to:
 * - View Face ID enrollment status
 * - Enroll Face ID (if not enrolled)
 * - Remove Face ID enrollment
 */
export const FaceIdSettings: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<FaceEnrollmentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch Face ID status
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const statusData = await faceAuthService.getFaceIdStatus();
      setStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Face ID status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle enrollment completion
  const handleEnrollmentComplete = useCallback(() => {
    setShowEnrollment(false);
    setSuccessMessage('Face ID enrolled successfully!');
    fetchStatus();
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [fetchStatus]);

  // Handle remove enrollment
  const handleRemove = useCallback(async () => {
    if (!confirm('Are you sure you want to remove Face ID? You will need to use your password to sign in.')) {
      return;
    }

    setIsRemoving(true);
    setError(null);

    try {
      await faceAuthService.removeFaceEnrollment();
      setSuccessMessage('Face ID removed successfully');
      fetchStatus();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove Face ID');
    } finally {
      setIsRemoving(false);
    }
  }, [fetchStatus]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-center py-8">
          <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Face ID</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in quickly and securely using facial recognition
            </p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                status?.isEnrolled 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {status?.isEnrolled ? (
                  <svg className="h-5 w-5 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {status?.isEnrolled ? 'Face ID is enabled' : 'Face ID is not set up'}
                </p>
                {status?.enrollmentDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enrolled on {new Date(status.enrollmentDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Action Button */}
            {status?.isEnrolled ? (
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                {isRemoving ? 'Removing...' : 'Remove'}
              </button>
            ) : status?.canEnroll ? (
              <button
                onClick={() => setShowEnrollment(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Set Up
              </button>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Not available
              </span>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">How it works</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Face ID uses your device&apos;s camera to recognize your face. Your facial data is encrypted 
                and never stored as raw images. You&apos;ll need to blink during setup to verify you&apos;re a real person.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Security</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your face data is encrypted with AES-256 and can only be used for authentication on this platform. 
                You can remove Face ID at any time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollment && user?.email && (
        <FaceEnrollment
          email={user.email}
          onEnrollmentComplete={handleEnrollmentComplete}
          onCancel={() => setShowEnrollment(false)}
        />
      )}
    </>
  );
};

export default FaceIdSettings;
