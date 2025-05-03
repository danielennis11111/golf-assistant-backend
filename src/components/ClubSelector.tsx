import React, { useState, useCallback } from 'react';
import './ClubSelector.css';
import { ImageAnalysisResult } from '../types/imageAnalysis';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://golf-assistant-backend.onrender.com'
  : 'http://localhost:3001';

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

export const ClubSelector: React.FC<ClubSelectorProps> = ({
  age = 25,
  windSpeed = 0,
  windDirection = 'none',
  onAnalysisComplete
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<ErrorDetails | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [localAge, setLocalAge] = useState(age);
  const [localWindSpeed, setLocalWindSpeed] = useState(windSpeed);
  const [localWindDirection, setLocalWindDirection] = useState(windDirection);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validImageTypes.includes(file.type)) {
      setAnalysisError({
        message: 'Invalid file type',
        details: 'Please upload a JPEG or PNG image',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setAnalysisError({
        message: 'File too large',
        details: 'Please upload an image smaller than 5MB',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setImageFile(file);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('age', localAge.toString());
    formData.append('windSpeed', localWindSpeed.toString());
    formData.append('windDirection', localWindDirection);

    try {
      const response = await fetch(`${API_URL}/api/image-analysis/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }

      if (!data) {
        throw new Error('No data received from server');
      }

      setAnalysisResult(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      let errorMessage = 'Failed to analyze image. Please try again.';
      let errorDetails = 'Unknown error occurred';

      if (error instanceof Error) {
        if (error.message.includes('pattern')) {
          errorMessage = 'Invalid image format';
          errorDetails = 'Please ensure the image is a valid JPEG or PNG file and try again';
        } else {
          errorDetails = error.message;
        }
      }

      setAnalysisError({
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete, localAge, localWindSpeed, localWindDirection]);

  return (
    <div className="club-selector">
      <header className="app-header">
        <h1>Golf Assistant Pro</h1>
        <p className="subtitle">AI-powered club recommendations</p>
      </header>

      <div className="main-upload-section">
        <div className="upload-container">
          <div className="upload-content">
            <h2>Analyze Your Shot</h2>
            <p>Take a photo of your course position to get AI-powered club recommendations</p>
            
            <div className="parameters-section">
              <div className="parameter-group">
                <label htmlFor="age">Age:</label>
                <input
                  type="number"
                  id="age"
                  value={localAge}
                  onChange={(e) => setLocalAge(Number(e.target.value))}
                  min="0"
                  max="120"
                />
              </div>
              
              <div className="parameter-group">
                <label htmlFor="windSpeed">Wind Speed (mph):</label>
                <input
                  type="number"
                  id="windSpeed"
                  value={localWindSpeed}
                  onChange={(e) => setLocalWindSpeed(Number(e.target.value))}
                  min="0"
                  max="50"
                />
              </div>
              
              <div className="parameter-group">
                <label htmlFor="windDirection">Wind Direction:</label>
                <select
                  id="windDirection"
                  value={localWindDirection}
                  onChange={(e) => setLocalWindDirection(e.target.value as 'none' | 'headwind' | 'tailwind')}
                >
                  <option value="none">None</option>
                  <option value="headwind">Headwind</option>
                  <option value="tailwind">Tailwind</option>
                </select>
              </div>
            </div>

            <label htmlFor="course-image" className="upload-button">
              {isAnalyzing ? 'Analyzing...' : 'Take Photo / Upload Image'}
              <input
                type="file"
                id="course-image"
                accept="image/*"
                onChange={handleImageUpload}
                className="image-input"
              />
            </label>
            {imageFile && <p className="file-name">Selected: {imageFile.name}</p>}
            {analysisError && (
              <div className="error">
                <p>{analysisError.message}</p>
                {analysisError.details && (
                  <p className="error-details">Details: {analysisError.details}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {analysisResult && (
        <div className="results-section">
          <div className="recommendation-card">
            <div className="club-name">{analysisResult.recommendation.club}</div>
            <p className="club-description">{analysisResult.recommendation.reasoning}</p>
            
            {analysisResult.recommendation.puttingAnalysis && (
              <div className="putting-analysis">
                <div className="putting-details">
                  <div className="putting-detail">
                    <span className="label">Break Direction:</span>
                    <span className="value">{analysisResult.recommendation.puttingAnalysis.breakLine.direction}</span>
                  </div>
                  <div className="putting-detail">
                    <span className="label">Break Intensity:</span>
                    <span className="value">{analysisResult.recommendation.puttingAnalysis.breakLine.intensity}</span>
                  </div>
                  <div className="putting-detail">
                    <span className="label">Speed:</span>
                    <span className="value">{analysisResult.recommendation.puttingAnalysis.recommendedPath.speed}</span>
                  </div>
                </div>
                
                {(analysisResult as any).puttingPathImage && (
                  <div className="putting-path-image">
                    <img 
                      src={`${API_URL}/uploads/${(analysisResult as any).puttingPathImage.split('/').pop()}`}
                      alt="Recommended putting path"
                      className="path-overlay"
                    />
                  </div>
                )}
              </div>
            )}
            
            {!analysisResult.recommendation.puttingAnalysis && (
              <div className="trajectory-info">
                <div className="trajectory-detail">
                  <span className="label">Height:</span>
                  <span className="value">{analysisResult.recommendation.trajectory.height}</span>
                </div>
                <div className="trajectory-detail">
                  <span className="label">Shape:</span>
                  <span className="value">{analysisResult.recommendation.trajectory.shape}</span>
                </div>
              </div>
            )}
            
            {localAge > 50 && (
              <div className="age-note">
                Note: This recommendation has been adjusted for your age group.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubSelector; 