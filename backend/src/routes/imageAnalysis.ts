import express from 'express';
import multer from 'multer';
import { analyzeImage } from '../services/imageAnalysis.js';
import { ImageAnalysisResult, AnalysisParameters } from '../types/imageAnalysis.js';
import os from 'os';
import path from 'path';

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use OS temp directory
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }

    // Specifically check for JPEG and PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Only JPEG and PNG images are allowed'));
      return;
    }

    cb(null, true);
  }
});

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Log detailed file information
    console.log('Processing file:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      encoding: req.file.encoding
    });

    // Extract analysis parameters from request body
    const parameters: AnalysisParameters = {
      age: req.body.age ? parseInt(req.body.age) : undefined,
      windSpeed: req.body.windSpeed ? parseFloat(req.body.windSpeed) : undefined,
      windDirection: req.body.windDirection as 'none' | 'headwind' | 'tailwind' | undefined
    };

    console.log('Analysis parameters:', parameters);

    try {
      const result: ImageAnalysisResult = await analyzeImage(req.file.path, parameters);
      res.json(result);
    } finally {
      // Clean up the temporary file
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Clean up the temporary file if it exists
    if (req.file?.path) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }

    // Send more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export const imageAnalysisRouter = router; 