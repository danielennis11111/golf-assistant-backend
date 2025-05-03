'use client';

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { AnalysisParameters, ImageAnalysisResult } from '@golf-assistant/types';

// API endpoint based on environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UploadState {
  file: File | null;
  isUploading: boolean;
  error: string | null;
  result: ImageAnalysisResult | null;
}

export function ClubSelector() {
  const [age, setAge] = useState<number>(25);
  const [windSpeed, setWindSpeed] = useState<number>(0);
  const [windDirection, setWindDirection] = useState<'none' | 'headwind' | 'tailwind'>('none');
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isUploading: false,
    error: null,
    result: null
  });

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validImageTypes.includes(file.type)) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please upload a JPEG or PNG image',
        file: null
      }));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please upload an image smaller than 5MB',
        file: null
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      isUploading: true,
      error: null,
      result: null
    }));

    const formData = new FormData();
    formData.append('image', file);
    formData.append('age', age.toString());
    formData.append('windSpeed', windSpeed.toString());
    formData.append('windDirection', windDirection);

    try {
      const response = await axios.post<ImageAnalysisResult>(
        `${API_URL}/api/image-analysis/analyze`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadState(prev => ({
        ...prev,
        result: response.data,
        isUploading: false
      }));
    } catch (error) {
      console.error('Error analyzing image:', error);
      let errorMessage = 'Failed to analyze image. Please try again.';
      
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || errorMessage;
      }

      setUploadState(prev => ({
        ...prev,
        error: errorMessage,
        isUploading: false
      }));
    }
  }, [age, windSpeed, windDirection]);

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Golf Assistant Pro</h1>
        <p className="text-gray-600 dark:text-gray-400">AI-powered club recommendations</p>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Analyze Your Shot</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Take a photo of your course position to get AI-powered club recommendations
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col">
            <label htmlFor="age" className="mb-2 font-medium">
              Age:
            </label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              min="0"
              max="120"
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700"
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="windSpeed" className="mb-2 font-medium">
              Wind Speed (mph):
            </label>
            <input
              type="number"
              id="windSpeed"
              value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              min="0"
              max="50"
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700"
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="windDirection" className="mb-2 font-medium">
              Wind Direction:
            </label>
            <select
              id="windDirection"
              value={windDirection}
              onChange={(e) => setWindDirection(e.target.value as 'none' | 'headwind' | 'tailwind')}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700"
            >
              <option value="none">None</option>
              <option value="headwind">Headwind</option>
              <option value="tailwind">Tailwind</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <label htmlFor="course-image" className="mb-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md cursor-pointer">
            {uploadState.isUploading ? 'Analyzing...' : 'Take Photo / Upload Image'}
            <input
              type="file"
              id="course-image"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          {uploadState.file && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selected: {uploadState.file.name}
            </p>
          )}
          {uploadState.error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
              {uploadState.error}
            </div>
          )}
        </div>
      </div>

      {uploadState.result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recommendation</h2>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
            <h3 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-400">
              {uploadState.result.recommendation.club}
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {uploadState.result.recommendation.reasoning}
            </p>
          </div>
          
          {uploadState.result.recommendation.puttingAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Putting Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Break Direction:</span>
                    <span>{uploadState.result.recommendation.puttingAnalysis.breakLine.direction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Break Intensity:</span>
                    <span>{uploadState.result.recommendation.puttingAnalysis.breakLine.intensity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Speed:</span>
                    <span>{uploadState.result.recommendation.puttingAnalysis.recommendedPath.speed}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Shot Details</h4>
                {uploadState.result.distance && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                    <span>{uploadState.result.distance} yards</span>
                  </div>
                )}
                {uploadState.result.terrain && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Terrain:</span>
                    <span>{uploadState.result.terrain}</span>
                  </div>
                )}
                {uploadState.result.recommendation.trajectory && (
                  <>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Height:</span>
                      <span>{uploadState.result.recommendation.trajectory.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shape:</span>
                      <span>{uploadState.result.recommendation.trajectory.shape}</span>
                    </div>
                  </>
                )}
              </div>
              
              {uploadState.result.obstacles && uploadState.result.obstacles.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Obstacles</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {uploadState.result.obstacles.map((obstacle, index) => (
                      <li key={index}>{obstacle}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {age > 50 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md">
              Note: This recommendation has been adjusted for your age group.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 