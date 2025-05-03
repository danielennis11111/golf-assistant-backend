import express from 'express';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import fs from 'fs';

const router = express.Router();

// Initialize the Vision client with credentials from environment variable
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON 
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : undefined;

const vision = new ImageAnnotatorClient({
  credentials: credentials
});

router.post('/', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'No file path provided' });
    }

    // Read the image file
    const imageFile = fs.readFileSync(filePath);

    // Perform the analysis with Google Vision AI
    const [result] = await vision.objectLocalization({
      image: { content: imageFile.toString('base64') }
    });

    const objects = result.localizedObjectAnnotations || [];
    
    // Analyze the image for golf-related objects
    const golfObjects = objects.filter(obj => {
      const name = obj.name?.toLowerCase() || '';
      return name.includes('golf') || 
             name.includes('club') || 
             name.includes('ball') ||
             name.includes('person');
    });

    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    // Process the results
    const analysis = {
      club: 'unknown',
      confidence: 0,
      distance: 0,
      swingSpeed: 0,
      trajectory: {
        height: 'medium',
        shape: 'straight'
      }
    };

    // Update analysis based on detected objects
    if (golfObjects.length > 0) {
      const golfClub = golfObjects.find(obj => obj.name?.toLowerCase().includes('club'));
      if (golfClub) {
        analysis.club = golfClub.name || 'unknown';
        analysis.confidence = golfClub.score || 0;
      }
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Error analyzing image' });
  }
});

export default router; 