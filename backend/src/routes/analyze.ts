import express from 'express';
import multer from 'multer';
import { analyzeImage } from '../services/imageAnalysis';
import { ImageAnalysisResult } from '../types/imageAnalysis';
import os from 'os';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(os.tmpdir(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
});

router.post('/analyze', upload.single('image'), async (req, res) => {
  console.log('Received image upload request');
  
  try {
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File received:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const result = await analyzeImage(req.file.path);
    console.log('Analysis completed successfully:', result);
    
    // Clean up the uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        name: error.name
      } : undefined
    });
  }
});

export default router; 