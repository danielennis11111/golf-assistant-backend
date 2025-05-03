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

export interface ImageAnalysisResult {
  distance: number;
  elevation: number;
  confidence: number;
  terrain: string;
  recommendation: ClubRecommendation;
}

export interface Point {
  x: number;
  y: number;
  z: number;
}

export interface DepthMap {
  points: Point[];
  width: number;
  height: number;
}

export type TerrainType = 'flat' | 'rough' | 'hilly' | 'challenging';

export interface TerrainAnalysis {
  type: TerrainType;
  slope: number;
  roughness: number;
}

export interface AnalysisParameters {
  age?: number;
  windSpeed?: number;
  windDirection?: 'none' | 'headwind' | 'tailwind';
} 