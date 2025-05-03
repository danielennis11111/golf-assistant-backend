import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import path from 'path';

// Initialize the Vision API client with credentials from environment variable
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');
console.log('Google Cloud credentials loaded:', !!credentials.private_key);
const visionClient = new ImageAnnotatorClient({ credentials });

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Configure CORS - temporarily allow all origins for testing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    hasCredentials: !!credentials.private_key
  });
});

// Image analysis endpoint
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  console.log('Image analysis requested');
  try {
    if (!req.file) {
      console.log('No file provided');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File received:', {
      size: req.file.size,
      mimetype: req.file.mimetype,
      hasBuffer: !!req.file.buffer
    });

    // Perform image analysis using Google Cloud Vision AI
    const [result] = await visionClient.annotateImage({
      image: { content: req.file.buffer.toString('base64') },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'IMAGE_PROPERTIES' },
      ],
    });

    console.log('Analysis completed:', {
      labels: result.labelAnnotations?.length,
      objects: result.localizedObjectAnnotations?.length
    });

    // Extract relevant information from the analysis
    const labels = result.labelAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];
    const properties = result.imagePropertiesAnnotation || {};

    // Analyze terrain type
    const terrain = analyzeTerrain(labels, objects);

    // Estimate distance based on object sizes and positions
    const distance = estimateDistance(objects);

    // Estimate elevation based on image perspective
    const elevation = estimateElevation(properties);

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
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

function analyzeTerrain(labels: any[], objects: any[]): string {
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

function estimateDistance(objects: any[]): number {
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

function estimateElevation(properties: any): number {
  const colors = properties.dominantColors?.colors || [];
  if (colors.length > 0) {
    // Use the position of dominant colors to estimate elevation
    const topColor = colors[0].color;
    const horizonPosition = (topColor.red + topColor.green + topColor.blue) / (255 * 3);
    return Math.round((horizonPosition - 0.5) * 20); // Convert to feet
  }
  return 0;
}

function calculateConfidence(labels: any[], objects: any[]): number {
  const relevantLabels = labels.filter(label => 
    label.description.toLowerCase().includes('golf') ||
    label.description.toLowerCase().includes('course') ||
    label.description.toLowerCase().includes('grass') ||
    label.description.toLowerCase().includes('green')
  );

  const relevantObjects = objects.filter(obj => 
    obj.name.toLowerCase().includes('ball') ||
    obj.name.toLowerCase().includes('flag') ||
    obj.name.toLowerCase().includes('hole')
  );

  // Calculate confidence based on number of relevant features detected
  const labelConfidence = Math.min(relevantLabels.length / 4, 1);
  const objectConfidence = Math.min(relevantObjects.length / 2, 1);

  return (labelConfidence + objectConfidence) / 2;
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 