export interface ClubRecommendation {
  club: string;
  confidence: number;
  reasoning: string;
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