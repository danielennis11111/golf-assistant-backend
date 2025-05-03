import express from 'express';
import multer from 'multer';
import { analyzeImage } from '../services/imageAnalysis';
import { ImageAnalysisResult } from '../types/imageAnalysis';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result: ImageAnalysisResult = await analyzeImage(req.file.path);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

export const imageAnalysisRouter = router; 