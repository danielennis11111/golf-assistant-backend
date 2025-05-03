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

// Serve static files from the uploads directory
router.use('/uploads', express.static(os.tmpdir()));

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Parse parameters
    const parameters: AnalysisParameters = {
      age: req.body.age ? parseInt(req.body.age) : undefined,
      windSpeed: req.body.windSpeed ? parseInt(req.body.windSpeed) : undefined,
      windDirection: req.body.windDirection as 'none' | 'headwind' | 'tailwind' | undefined
    };

    const result: ImageAnalysisResult = await analyzeImage(req.file.path, parameters);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

export const imageAnalysisRouter = router; 