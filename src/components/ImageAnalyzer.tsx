import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './ImageAnalyzer.css';

interface AnalysisResult {
  distance: number;
  terrain: string;
  elevation: number;
  confidence: number;
}

const API_URL = process.env.REACT_APP_API_URL || 'https://golf-assistant-backend.onrender.com';

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
      setAnalysis(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch(`${API_URL}/api/analyze-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to analyze image');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-analyzer">
      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="preview-container">
            <img
              src={preview}
              alt="Preview"
              className="preview-image"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                analyzeImage();
              }}
              disabled={loading}
              className="analyze-button"
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <p>{isDragActive ? 'Drop the image here' : 'Drag & drop a golf course image here'}</p>
            <p>or click to select</p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {analysis && (
        <div className="analysis-results">
          <h3>Analysis Results</h3>
          <div className="result-grid">
            <div className="result-item">
              <span className="label">Distance to Target</span>
              <span className="value">{analysis.distance} yards</span>
            </div>
            <div className="result-item">
              <span className="label">Terrain Type</span>
              <span className="value">{analysis.terrain}</span>
            </div>
            <div className="result-item">
              <span className="label">Elevation Change</span>
              <span className="value">{analysis.elevation} feet</span>
            </div>
            <div className="result-item">
              <span className="label">Confidence</span>
              <span className="value">{Math.round(analysis.confidence * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer; 