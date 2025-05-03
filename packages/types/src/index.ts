export interface ClubRecommendation {
  club: string;
  confidence: number;
  distance: number;
}

export interface SwingAnalysis {
  speed: number;
  angle: number;
  recommendations: ClubRecommendation[];
} 