import React, { useState, useRef } from 'react';
import './ImageAnalyzer.css';

interface ImageAnalysis {
  distance: number;
  terrain: string;
  elevation: number;
  confidence: number;
}

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  return (
    <div className="image-analyzer">
      <div
        className="upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        {preview ? (
          <img src={preview} alt="Preview" className="preview-image" />
        ) : (
          <div className="upload-prompt">
            <p>Drag and drop an image here</p>
            <p>or click to select a file</p>
          </div>
        )}
      </div>

      {preview && (
        <button
          className="analyze-button"
          onClick={analyzeImage}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      )}

      {error && <p className="error">{error}</p>}

      {analysis && (
        <div className="analysis-results">
          <h3>Analysis Results</h3>
          <div className="result-item">
            <span className="label">Distance:</span>
            <span className="value">{analysis.distance} yards</span>
          </div>
          <div className="result-item">
            <span className="label">Terrain:</span>
            <span className="value">{analysis.terrain}</span>
          </div>
          <div className="result-item">
            <span className="label">Elevation:</span>
            <span className="value">{analysis.elevation} feet</span>
          </div>
          <div className="result-item">
            <span className="label">Confidence:</span>
            <span className="value">{Math.round(analysis.confidence * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer; 