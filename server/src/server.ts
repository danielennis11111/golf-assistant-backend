import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { visionClient } from './config/google-cloud';
import path from 'path';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No image file provided');
    }

    // Perform image analysis using Google Cloud Vision AI
    const [result] = await visionClient.annotateImage({
      image: { content: req.file.buffer },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'IMAGE_PROPERTIES' },
      ],
    });

    // Extract relevant information from the analysis
    const labels = result.labelAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];
    const properties = result.imagePropertiesAnnotation || {};

    // Analyze terrain type
    const terrain = analyzeTerrain(labels, objects);

    // Estimate distance based on object sizes and positions
    const distance = estimateDistance(objects, properties);

    // Estimate elevation based on image perspective
    const elevation = estimateElevation(objects, properties);

    // Calculate confidence score
    const confidence = calculateConfidence(labels, objects);

    res.json({
      distance,
      terrain,
      elevation,
      confidence,
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'An error occurred' });
  }
});

function analyzeTerrain(labels: any[], objects: any[]): string {
  // Look for specific terrain features
  const terrainKeywords = {
    fairway: ['grass', 'green', 'fairway', 'golf course'],
    rough: ['rough', 'tall grass', 'weeds', 'bush'],
    bunker: ['sand', 'bunker', 'trap'],
  };

  for (const [terrain, keywords] of Object.entries(terrainKeywords)) {
    if (keywords.some(keyword => 
      labels.some(label => label.description.toLowerCase().includes(keyword)) ||
      objects.some(obj => obj.name.toLowerCase().includes(keyword))
    )) {
      return terrain;
    }
  }

  return 'fairway'; // Default to fairway if no specific terrain is detected
}

function estimateDistance(objects: any[], properties: any): number {
  // Use object sizes and positions to estimate distance
  const golfBall = objects.find(obj => obj.name.toLowerCase().includes('ball'));
  const flag = objects.find(obj => obj.name.toLowerCase().includes('flag'));

  if (golfBall && flag) {
    // Calculate relative size and position
    const ballSize = golfBall.boundingPoly.normalizedVertices.reduce((acc: number, vertex: any) => {
      return acc + Math.sqrt(Math.pow(vertex.x, 2) + Math.pow(vertex.y, 2));
    }, 0);

    const flagSize = flag.boundingPoly.normalizedVertices.reduce((acc: number, vertex: any) => {
      return acc + Math.sqrt(Math.pow(vertex.x, 2) + Math.pow(vertex.y, 2));
    }, 0);

    // Use relative sizes to estimate distance
    const sizeRatio = ballSize / flagSize;
    return Math.round(100 / sizeRatio); // Simplified distance estimation
  }

  return 150; // Default distance if no objects are detected
}

function estimateElevation(objects: any[], properties: any): number {
  // Use image perspective and object positions to estimate elevation
  const horizon = properties.dominantColors?.colors?.[0]?.color;
  if (horizon) {
    // Use horizon position to estimate elevation
    const horizonPosition = horizon.red / 255; // Simplified elevation estimation
    return Math.round((horizonPosition - 0.5) * 20); // Convert to feet
  }

  return 0; // Default to level if no elevation can be determined
}

function calculateConfidence(labels: any[], objects: any[]): number {
  // Calculate confidence based on the number and relevance of detected features
  const relevantLabels = labels.filter(label => 
    label.description.toLowerCase().includes('golf') ||
    label.description.toLowerCase().includes('course') ||
    label.description.toLowerCase().includes('ball') ||
    label.description.toLowerCase().includes('flag')
  );

  const relevantObjects = objects.filter(obj => 
    obj.name.toLowerCase().includes('ball') ||
    obj.name.toLowerCase().includes('flag') ||
    obj.name.toLowerCase().includes('hole')
  );

  const confidence = (relevantLabels.length + relevantObjects.length) / 10;
  return Math.min(confidence, 1); // Cap at 100%
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 