import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { analyzeImage } from '../services/imageAnalysis';
import { AnalysisParameters } from '@golf-assistant/types';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

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
      const error = new Error('Only image files are allowed') as AppError;
      error.statusCode = 400;
      return cb(error);
    }

    // Specifically check for JPEG and PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Only JPEG and PNG images are allowed') as AppError;
      error.statusCode = 400;
      return cb(error);
    }

    cb(null, true);
  }
});

// Serve static files from the uploads directory
router.use('/uploads', express.static(os.tmpdir()));

router.post('/analyze', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      const error = new Error('No image file provided') as AppError;
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Processing image analysis request: ${req.file.originalname}`);

    // Parse parameters
    const parameters: AnalysisParameters = {
      age: req.body.age ? parseInt(req.body.age) : undefined,
      windSpeed: req.body.windSpeed ? parseInt(req.body.windSpeed) : undefined,
      windDirection: req.body.windDirection as 'none' | 'headwind' | 'tailwind' | undefined
    };

    logger.debug('Analysis parameters:', parameters);

    const result = await analyzeImage(req.file.path, parameters);
    
    logger.info(`Successfully analyzed image: ${req.file.originalname}`);
    res.json(result);
  } catch (error) {
    logger.error('Error analyzing image:', error);
    next(error);
  }
});

export const imageAnalysisRouter = router; 