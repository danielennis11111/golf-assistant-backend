import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './ClubSelector.css';
import { ImageAnalysisResult, AnalysisError } from '../types/imageAnalysis';

const API_URL = 'https://golf-assistant-backend.onrender.com';

interface ClubSelectorProps {
  age?: number;
  windSpeed?: number;
  windDirection?: 'none' | 'headwind' | 'tailwind';
  onAnalysisComplete?: (result: ImageAnalysisResult) => void;
}

interface ErrorDetails {
  message: string;
  details?: string;
  timestamp?: string;
}

interface AnalysisResult {
  club: string;
  confidence: number;
  distance: number;
  swingSpeed?: number;
  trajectory?: {
    height: string;
    shape: string;
  };
}

export const ClubSelector: React.FC<ClubSelectorProps> = ({
  age = 25,
  windSpeed = 0,
  windDirection = 'none',
  onAnalysisComplete
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAge, setLocalAge] = useState(age);
  const [localWindSpeed, setLocalWindSpeed] = useState(windSpeed);
  const [localWindDirection, setLocalWindDirection] = useState(windDirection);

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setAnalysisResult(null);
      setError(null);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, upload the image to get a secure URL
      const formData = new FormData();
      formData.append('image', selectedImage);

      const uploadResponse = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadResponse.data.imageUrl) {
        throw new Error('Failed to upload image');
      }

      // Now analyze the image using the secure URL
      const analysisResponse = await axios.post(`${API_URL}/api/analyze`, {
        imageUrl: uploadResponse.data.imageUrl,
      });

      setAnalysisResult(analysisResponse.data);
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResponse.data);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage, onAnalysisComplete]);

  return (
    <div className="club-selector">
      <header className="app-header">
        <h1>Golf Assistant Pro</h1>
        <p className="subtitle">AI-powered club recommendations</p>
      </header>

      <div className="main-content">
        <div className="upload-section">
          <h2>Analyze Your Shot</h2>
          <p>Take a photo of your course position to get AI-powered club recommendations</p>
          
          <div className="upload-controls">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="file-input"
            />
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading}
              className="analyze-button"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Shot'}
            </button>
          </div>

          {selectedImage && (
            <p className="selected-file">
              Selected: {selectedImage.name}
            </p>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="results-section">
            <div className="recommendation-card">
              <h3>Recommended Club</h3>
              <div className="club-name">{analysisResult.club}</div>
              <div className="confidence">
                Confidence: {(analysisResult.confidence * 100).toFixed(1)}%
              </div>
              <div className="distance">
                Estimated Distance: {analysisResult.distance} yards
              </div>
              {analysisResult.swingSpeed && (
                <div className="swing-speed">
                  Swing Speed: {analysisResult.swingSpeed} mph
                </div>
              )}
              {analysisResult.trajectory && (
                <div className="trajectory">
                  <div>Height: {analysisResult.trajectory.height}</div>
                  <div>Shape: {analysisResult.trajectory.shape}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubSelector; 