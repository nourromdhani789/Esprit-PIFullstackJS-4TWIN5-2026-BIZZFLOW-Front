import api from './api';
import type { AuthResponse } from './auth.service';

// Type for API error responses
interface ApiError {
  message?: string;
  error?: string;
}

export interface FaceDescriptorData {
  descriptor: number[];
  livenessScore: number;
  timestamp: number;
}

export interface AntiSpoofingData {
  challengeId: string;
  challengeResponse: string;
  blinkDetected: boolean;
}

export interface FaceEnrollmentRequest {
  email: string;
  faceDescriptor: FaceDescriptorData;
  antiSpoofingData: AntiSpoofingData;
}

export interface FaceLoginRequest {
  email: string;
  faceDescriptor: FaceDescriptorData;
  antiSpoofingData: AntiSpoofingData;
}

export interface ChallengeResponse {
  challengeId: string;
  instructions: string;
  expectedResponse: string;
}

export interface FaceEnrollmentStatus {
  isEnabled: boolean;
  isEnrolled: boolean;
  enrollmentDate?: string;
  canEnroll: boolean;
}

export interface EnrollmentCheckResponse {
  hasFaceId: boolean;
}

/**
 * Service for Face ID authentication operations
 * 
 * Features:
 * - Face enrollment (after password login)
 * - Face login (alternative to password)
 * - Anti-spoofing challenge/response
 * - Enrollment status checking
 */
export const faceAuthService = {
  /**
   * Get anti-spoofing challenge from server
   * Must be called before face capture for enrollment or login
   */
  async getChallenge(email: string): Promise<ChallengeResponse> {
    try {
      const response = await api.post('/auth/face/challenge', { email });
      return response.data;
    } catch (error) {
      const apiError = error as { response?: { data?: ApiError } };
      throw new Error(apiError.response?.data?.message || 'Failed to get challenge');
    }
  },

  /**
   * Enroll face for authenticated user
   * User must be logged in with password first
   */
  async enrollFace(data: FaceEnrollmentRequest): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/face/enroll', data);
      return response.data;
    } catch (error) {
      const apiError = error as { response?: { data?: ApiError } };
      throw new Error(apiError.response?.data?.message || 'Face enrollment failed');
    }
  },

  /**
   * Login with Face ID
   * Alternative to password-based login
   */
  async loginWithFace(data: FaceLoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/face/login', data);
      const { access_token, user } = response.data;
      
      // Store token and user data (same as password login)
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      const apiError = error as { response?: { data?: ApiError } };
      throw new Error(apiError.response?.data?.message || 'Face login failed');
    }
  },

  /**
   * Remove face enrollment
   * Disables Face ID for the user
   */
  async removeFaceEnrollment(): Promise<{ message: string }> {
    try {
      const response = await api.delete('/auth/face/enroll');
      return response.data;
    } catch (error) {
      const apiError = error as { response?: { data?: ApiError } };
      throw new Error(apiError.response?.data?.message || 'Failed to remove face enrollment');
    }
  },

  /**
   * Get Face ID enrollment status for current user
   */
  async getFaceIdStatus(): Promise<FaceEnrollmentStatus> {
    try {
      const response = await api.get('/auth/face/status');
      return response.data;
    } catch (error) {
      const apiError = error as { response?: { data?: ApiError } };
      throw new Error(apiError.response?.data?.message || 'Failed to get face ID status');
    }
  },

  /**
   * Check if an email has Face ID enrolled (public endpoint)
   * Used to show/hide Face ID login option
   */
  async checkEnrollment(email: string): Promise<EnrollmentCheckResponse> {
    try {
      const response = await api.post('/auth/face/check-enrollment', { email });
      return response.data;
    } catch (error) {
      // Return false on any error to prevent email enumeration
      return { hasFaceId: false };
    }
  },

  /**
   * Calculate challenge response
   * Server now only validates that challenge ID was issued and is recent
   * Any non-empty response is accepted
   */
  calculateChallengeResponse(_challengeId: string): string {
    // Simple response - server just checks it's non-empty
    return 'verified';
  }
};

export default faceAuthService;
