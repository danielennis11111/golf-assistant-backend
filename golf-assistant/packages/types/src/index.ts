/**
 * Analysis parameters sent from frontend to backend
 */
export interface AnalysisParameters {
  age?: number;
  windSpeed?: number;
  windDirection?: 'none' | 'headwind' | 'tailwind';
}

/**
 * Trajectory information for a golf shot
 */
export interface Trajectory {
  height: string; // "Low" | "Medium" | "High"
  shape: string;  // "Straight" | "Draw" | "Fade"
}

/**
 * Break line information for putting
 */
export interface BreakLine {
  direction: string; // "Left to Right" | "Right to Left" | "Straight"
  intensity: string; // "Slight" | "Moderate" | "Heavy"
}

/**
 * Recommended putting path
 */
export interface RecommendedPuttingPath {
  speed: string; // "Slow" | "Medium" | "Fast"
}

/**
 * Putting analysis data
 */
export interface PuttingAnalysis {
  breakLine: BreakLine;
  recommendedPath: RecommendedPuttingPath;
}

/**
 * Club recommendation
 */
export interface ClubRecommendation {
  club: string;
  reasoning: string;
  trajectory?: Trajectory;
  puttingAnalysis?: PuttingAnalysis;
}

/**
 * Result of image analysis
 */
export interface ImageAnalysisResult {
  recommendation: ClubRecommendation;
  distance?: number;
  terrain?: string;
  obstacles?: string[];
  puttingPathImage?: string;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  details?: string;
  timestamp?: string;
}

/**
 * User profile
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  handicap?: number;
  preferences?: {
    preferredUnits: 'yards' | 'meters';
    clubPreferences?: Record<string, string>;
  };
}

/**
 * Authentication result
 */
export interface AuthResult {
  token: string;
  user: UserProfile;
} 