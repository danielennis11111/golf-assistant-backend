// Types for putting analysis
export interface PuttingAnalysis {
  distance: number;  // Distance in feet
  slope: {
    direction: 'left' | 'right' | 'uphill' | 'downhill' | 'flat';
    degree: number;  // Slope degree 0-10
  };
  breakLine: {
    direction: 'left' | 'right';
    intensity: 'slight' | 'moderate' | 'strong';
  };
  recommendedPath: {
    aimPoint: {
      direction: 'left' | 'right';
      inches: number;
    };
    speed: 'soft' | 'medium' | 'firm';
    breakDescription: string;
  };
}

// Types for club recommendations
export interface ClubRecommendation {
  club: string;
  confidence: number;
  reasoning: string;
  trajectory: {
    height: 'high' | 'normal' | 'low';
    shape: 'fade' | 'straight' | 'draw';
  };
  puttingAnalysis?: PuttingAnalysis;  // Only present for putting shots
}

// Main analysis result type
export interface ImageAnalysisResult {
  distance: number;
  elevation: number;
  confidence: number;
  terrain: string;
  recommendation: ClubRecommendation;
}

// 3D point type
export interface Point {
  x: number;
  y: number;
  z: number;
}

// Depth map type
export interface DepthMap {
  points: Point[];
  width: number;
  height: number;
}

// Terrain types
export type TerrainType = 'flat' | 'rough' | 'hilly' | 'challenging';

// Terrain analysis type
export interface TerrainAnalysis {
  type: TerrainType;
  slope: number;
  roughness: number;
}

// Analysis parameters type
export interface AnalysisParameters {
  age?: number;
  windSpeed?: number;
  windDirection?: 'none' | 'headwind' | 'tailwind';
} 