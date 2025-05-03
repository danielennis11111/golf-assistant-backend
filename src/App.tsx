import React from 'react';
import ClubSelector from './components/ClubSelector';
import ImageAnalyzer from './components/ImageAnalyzer';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Golf Assistant Pro</h1>
        <p className="subtitle">AI-powered club recommendations</p>
      </header>
      <main>
        <ClubSelector />
        <div className="analysis-section">
          <h2>Course Analysis</h2>
          <p className="section-description">Upload a golf course image for AI analysis</p>
          <ImageAnalyzer />
        </div>
      </main>
    </div>
  );
}

export default App; 