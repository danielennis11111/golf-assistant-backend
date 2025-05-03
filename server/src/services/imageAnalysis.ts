import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as tf from '@tensorflow/tfjs-node';
import sharp from 'sharp';
import { ImageAnalysisResult, Point, DepthMap, TerrainAnalysis, TerrainType } from '../types/imageAnalysis';

let visionClient: ImageAnnotatorClient | null = null;

// Initialize Vision API client
try {
  console.log('Attempting to initialize Vision API client with application default credentials...');
  visionClient = new ImageAnnotatorClient();
  console.log('Successfully initialized Vision API client with application default credentials');
} catch (error) {
  console.log('Failed to initialize with application default credentials, trying environment variables...');
  try {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set');
    }
    
    const parsedCredentials = JSON.parse(credentials);
    if (!parsedCredentials.project_id) {
      throw new Error('Invalid credentials: missing project_id');
    }

    visionClient = new ImageAnnotatorClient({
      credentials: parsedCredentials,
      projectId: parsedCredentials.project_id
    });
    console.log('Successfully initialized Vision API client with credentials from environment');
  } catch (error) {
    console.error('Failed to initialize Vision API client:', error);
    // Don't throw here - let individual requests fail if the client isn't initialized
  }
}

async function estimateDepthMap(imagePath: string): Promise<DepthMap> {
  // Load and preprocess the image
  const image = await sharp(imagePath)
    .resize(640, 480)
    .toBuffer();

  // Load MiDaS model for depth estimation
  const model = await tf.loadGraphModel(
    'https://tfhub.dev/intel/midas/v2/2'
  );

  // Convert image to tensor
  const tensor = tf.node.decodeImage(image);
  const normalized = tf.div(tf.cast(tensor, 'float32'), 255.0);
  const batched = tf.expandDims(normalized, 0);

  // Get depth prediction
  const prediction = model.predict(batched) as tf.Tensor;
  const depthMapArray = await prediction.array() as number[][][];

  // Convert depth map to points
  const points: Point[] = [];
  const height = depthMapArray[0].length;
  const width = depthMapArray[0][0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      points.push({
        x,
        y,
        z: depthMapArray[0][y][x]
      });
    }
  }

  return {
    points,
    width,
    height
  };
}

async function analyzeTerrain(depthMap: DepthMap): Promise<TerrainAnalysis> {
  // Calculate slope and roughness from depth map
  let maxSlope = 0;
  let totalRoughness = 0;

  for (let i = 0; i < depthMap.points.length - depthMap.width; i++) {
    const currentPoint = depthMap.points[i];
    const nextPoint = depthMap.points[i + 1];
    const bottomPoint = depthMap.points[i + depthMap.width];

    const horizontalSlope = Math.abs(nextPoint.z - currentPoint.z);
    const verticalSlope = Math.abs(bottomPoint.z - currentPoint.z);
    
    maxSlope = Math.max(maxSlope, horizontalSlope, verticalSlope);
    totalRoughness += (horizontalSlope + verticalSlope) / 2;
  }

  const averageRoughness = totalRoughness / depthMap.points.length;

  // Determine terrain type based on slope and roughness
  let terrainType: TerrainType = 'flat';
  if (maxSlope > 0.3) terrainType = 'hilly';
  if (averageRoughness > 0.1) terrainType = 'rough';
  if (maxSlope > 0.3 && averageRoughness > 0.1) terrainType = 'challenging';

  return {
    type: terrainType,
    slope: maxSlope,
    roughness: averageRoughness
  };
}

function generateExplanation(
  distance: number,
  elevation: number,
  terrain: TerrainAnalysis,
  windSpeed: number,
  windDirection: string,
  age: number,
  recommendedClub: string
): string {
  const parts: string[] = [];

  // Base distance explanation
  parts.push(`You're approximately ${Math.round(distance)} yards from the pin`);

  // Elevation context
  if (Math.abs(elevation) > 2) {
    parts.push(elevation > 0 
      ? `with an uphill lie of ${Math.round(elevation)} feet`
      : `with a downhill lie of ${Math.abs(Math.round(elevation))} feet`);
  }

  // Terrain description
  if (terrain.type !== 'flat') {
    const terrainDescriptions = {
      'rough': 'in the rough',
      'hilly': 'on a slope',
      'challenging': 'in a challenging position'
    };
    parts.push(terrainDescriptions[terrain.type] || '');
  }

  // Wind impact
  if (windSpeed > 0) {
    parts.push(windDirection === 'headwind'
      ? `facing a ${windSpeed} mph headwind`
      : `with a ${windSpeed} mph tailwind`);
  }

  // Age consideration
  if (age > 50) {
    parts.push(`considering your age group`);
  }

  // Join all parts with proper punctuation
  const situation = parts.join(' ');

  // Final recommendation
  return `${situation}. Based on these conditions, I recommend using your ${recommendedClub} for the best chance of success.`;
}

function generateClubRecommendations(
  distance: number,
  elevation: number,
  terrain: TerrainAnalysis,
  windSpeed: number = 0,
  windDirection: string = 'none',
  age: number = 25
): { club: string; confidence: number; reasoning: string } {
  let effectiveDistance = distance;

  // Adjust for elevation
  const elevationFactor = 0.2;
  const elevationAdjustment = Math.abs(elevation) * elevationFactor;
  effectiveDistance += elevation > 0 ? elevationAdjustment : -elevationAdjustment;

  // Adjust for wind
  if (windDirection === 'headwind') {
    effectiveDistance += windSpeed * 2;
  } else if (windDirection === 'tailwind') {
    effectiveDistance -= windSpeed * 1.5;
  }

  // Select base club
  let selectedClub = '';
  if (effectiveDistance > 200) {
    selectedClub = 'Driver';
  } else if (effectiveDistance > 170) {
    selectedClub = '3-Wood';
  } else if (effectiveDistance > 150) {
    selectedClub = '5-Iron';
  } else if (effectiveDistance > 100) {
    selectedClub = 'Pitching Wedge';
  } else {
    selectedClub = 'Sand Wedge';
  }

  // Adjust for terrain
  if (terrain.type === 'rough' || terrain.type === 'challenging') {
    // Club up for difficult terrain
    const clubProgression = ['Sand Wedge', 'Pitching Wedge', '5-Iron', '3-Wood', 'Driver'];
    const currentIndex = clubProgression.indexOf(selectedClub);
    if (currentIndex < clubProgression.length - 1) {
      selectedClub = clubProgression[currentIndex + 1];
    }
  }

  // Adjust for age
  if (age > 65 && selectedClub === 'Driver') {
    selectedClub = '3-Wood';
  } else if (age > 50 && selectedClub === '5-Iron') {
    selectedClub = '4-Iron';
  }

  const explanation = generateExplanation(
    distance,
    elevation,
    terrain,
    windSpeed,
    windDirection,
    age,
    selectedClub
  );

  return {
    club: selectedClub,
    confidence: 0.85,
    reasoning: explanation
  };
}

export async function analyzeImage(imagePath: string): Promise<ImageAnalysisResult> {
  try {
    if (!visionClient) {
      throw new Error('Vision API client is not initialized. Check your credentials configuration.');
    }

    // Analyze image with Google Cloud Vision
    console.log('Starting image analysis with Vision API...');
    const [result] = await visionClient.annotateImage({
      image: { source: { filename: imagePath } },
      features: [
        { type: 'LANDMARK_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'TEXT_DETECTION' },
      ],
    });
    console.log('Successfully received Vision API response');

    // Get depth map and terrain analysis
    const depthMap = await estimateDepthMap(imagePath);
    const terrain = await analyzeTerrain(depthMap);

    return {
      terrain,
      recommendations: {
        club: 'Driver',
        confidence: 0.85,
        reasoning: 'Based on initial analysis'
      }
    };
  } catch (error) {
    console.error('Error in image analysis:', error);
    throw error;
  }
} 