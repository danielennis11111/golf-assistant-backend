export type Point = {
  x: number;
  y: number;
  z: number;
};

export type DepthMap = {
  points: Point[];
  width: number;
  height: number;
};

export type TerrainType = 'flat' | 'rough' | 'hilly' | 'challenging';

export type TerrainAnalysis = {
  type: TerrainType;
  slope: number;
  roughness: number;
};

export type ImageAnalysisResult = {
  terrain: TerrainAnalysis;
  recommendations: {
    club: string;
    confidence: number;
    reasoning: string;
  };
};

export interface ClubRecommendation {
  club: string;
  confidence: number;
  reasoning: string;
} 