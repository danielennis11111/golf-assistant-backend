import React from 'react';
import ClubSelector from './components/ClubSelector';
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
      </main>
    </div>
  );
}

export default App; 