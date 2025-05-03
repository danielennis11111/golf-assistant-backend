import express from 'express';
import { analyzeImage } from '../services/imageAnalysis';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    const analysis = await analyzeImage(imageUrl);
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

export { router as analyzeRouter }; 