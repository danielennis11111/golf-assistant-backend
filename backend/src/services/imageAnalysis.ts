import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { ImageAnalysisResult } from '../types/imageAnalysis';
import fs from 'fs';

type LocalizedObject = protos.google.cloud.vision.v1.ILocalizedObjectAnnotation;
type EntityAnnotation = protos.google.cloud.vision.v1.IEntityAnnotation;

// Initialize the Google Cloud Vision client with credentials
let visionClient: ImageAnnotatorClient | null = null;

async function initializeVisionClient(): Promise<ImageAnnotatorClient> {
  if (visionClient) {
    console.log('Using existing Vision client');
    return visionClient;
  }

  try {
    console.log('Initializing new Vision client...');
    console.log('Current NODE_ENV:', process.env.NODE_ENV);
    console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
    console.log('Credentials present:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      console.log('No credentials found. If this is production, check Render.com environment variables.');
      if (process.env.NODE_ENV === 'production') {
        console.log('Running in production but no credentials found - this is likely a configuration issue.');
      }
      throw new Error('Google Cloud Vision credentials not found in environment variables');
    }

    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      console.log('Successfully parsed credentials JSON');
      
      // Verify credentials structure
      if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
        console.log('Invalid credential structure. Missing required fields:', {
          hasProjectId: !!credentials.project_id,
          hasPrivateKey: !!credentials.private_key,
          hasClientEmail: !!credentials.client_email
        });
        throw new Error('Invalid credentials structure');
      }

      console.log('Creating Vision client with project:', credentials.project_id);
      const client = new ImageAnnotatorClient({ credentials });
      console.log('Successfully initialized Google Cloud Vision client');
      visionClient = client;
      return client;
    } catch (parseError) {
      console.error('Error parsing credentials JSON:', parseError);
      if (parseError instanceof SyntaxError) {
        console.log('Credentials JSON is malformed. Please check the format in Render.com');
      }
      throw new Error('Failed to parse Google Cloud Vision credentials');
    }
  } catch (error) {
    console.error('Error initializing Google Cloud Vision client:', error);
    throw error;
  }
}

export async function analyzeImage(imagePath: string): Promise<ImageAnalysisResult> {
  try {
    console.log('Starting image analysis for:', imagePath);
    const client = await initializeVisionClient();
    
    // Read the image file
    console.log('Reading image file...');
    const imageContent = await fs.promises.readFile(imagePath);
    console.log('Image file read successfully, size:', imageContent.length);
    
<<<<<<< HEAD
    // Perform label detection
    console.log('Performing label detection...');
    const [result] = await client.labelDetection!({
      image: { content: imageContent }
=======
    // Perform multiple types of analysis
    const [labelResult, objectResult, textResult] = await Promise.all([
      client.labelDetection({ image: { content: imageContent } }),
      client.objectLocalization({ image: { content: imageContent } }),
      client.textDetection({ image: { content: imageContent } })
    ]);

    const labels = labelResult[0].labelAnnotations || [];
    const objects = objectResult[0].localizedObjectAnnotations || [];
    const text = textResult[0].textAnnotations || [];

    // Enhanced golf-related detection
    const golfLabels = labels.filter(label => {
      const desc = label.description?.toLowerCase() || '';
      return desc.includes('golf') || 
             desc.includes('club') || 
             desc.includes('course') ||
             desc.includes('fairway') ||
             desc.includes('rough') ||
             desc.includes('bunker') ||
             desc.includes('green') ||
             desc.includes('tee') ||
             desc.includes('flag') ||
             desc.includes('hole');
>>>>>>> 474bd08c673ac8be9f3a5faea3a14679ab92e278
    });
    console.log('Label detection completed');

<<<<<<< HEAD
    const labels = result.labelAnnotations || [];
    console.log('Detected labels:', labels.map(l => l.description).join(', '));
    
    // Extract golf-related information
    const golfLabels = labels.filter(label => 
      label.description?.toLowerCase().includes('golf') ||
      label.description?.toLowerCase().includes('club') ||
      label.description?.toLowerCase().includes('course')
    );
    console.log('Golf-related labels:', golfLabels.map(l => l.description).join(', '));

    // Analyze the scene
    console.log('Performing object localization...');
    const [objectResult] = await client.objectLocalization!({
      image: { content: imageContent }
    });
    console.log('Object localization completed');

    const objects = objectResult.localizedObjectAnnotations || [];
    console.log('Detected objects:', objects.map(o => o.name).join(', '));
    
    // Determine club type and confidence
    const club = determineClub(golfLabels, objects);
    const confidence = calculateConfidence(golfLabels, objects);
    const distance = estimateDistance(objects);
    const terrain = analyzeTerrain(labels);
    const elevation = estimateElevation(labels);
=======
    // Enhanced club detection
    const club = determineClub(golfLabels, objects, text);
    const confidence = calculateConfidence(golfLabels, objects, text);
    const distance = estimateDistance(objects, text);
    const terrain = analyzeTerrain(labels, objects);
    const elevation = estimateElevation(labels, objects);

    // Generate detailed reasoning
    const reasoning = generateReasoning(club, confidence, distance, terrain, elevation);
>>>>>>> 474bd08c673ac8be9f3a5faea3a14679ab92e278

    console.log('Analysis results:', {
      club,
      confidence,
      distance,
      terrain,
      elevation
    });

    return {
      club,
      confidence,
      distance,
      terrain,
      elevation,
      recommendation: {
        club,
        confidence,
        reasoning
      }
    };
  } catch (error: any) {
    console.error('Error in analyzeImage:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

function determineClub(
  labels: EntityAnnotation[],
  objects: LocalizedObject[],
  text: EntityAnnotation[]
): string {
  // Check text first (most reliable)
  const clubText = text.find(t => {
    const desc = t.description?.toLowerCase() || '';
    return desc.includes('driver') ||
           desc.includes('wood') ||
           desc.includes('iron') ||
           desc.includes('wedge') ||
           desc.includes('putter') ||
           desc.includes('hybrid');
  });

  if (clubText?.description) {
    return clubText.description;
  }

  // Check objects next
  const clubObject = objects.find(obj => {
    const name = obj.name?.toLowerCase() || '';
    return name.includes('golf club') ||
           name.includes('driver') ||
           name.includes('wood') ||
           name.includes('iron') ||
           name.includes('wedge') ||
           name.includes('putter');
  });

  if (clubObject?.name) {
    return clubObject.name;
  }

  // Check labels last
  const clubLabel = labels.find(label => {
    const desc = label.description?.toLowerCase() || '';
    return desc.includes('driver') ||
           desc.includes('wood') ||
           desc.includes('iron') ||
           desc.includes('wedge') ||
           desc.includes('putter');
  });

  if (clubLabel?.description) {
    return clubLabel.description;
  }

  // Default recommendation based on scene analysis
  const scene = analyzeScene(labels, objects);
  return getDefaultClub(scene);
}

function calculateConfidence(
  labels: EntityAnnotation[],
  objects: LocalizedObject[],
  text: EntityAnnotation[]
): number {
  let confidence = 0;
  let totalWeight = 0;

  // Text detection is most reliable
  if (text.length > 0) {
    confidence += 0.6;
    totalWeight += 0.6;
  }

  // Object detection is second most reliable
  if (objects.length > 0) {
    const golfObjects = objects.filter(obj => {
      const name = obj.name?.toLowerCase() || '';
      return name.includes('golf') || name.includes('club');
    });
    if (golfObjects.length > 0) {
      confidence += 0.3;
      totalWeight += 0.3;
    }
  }

  // Label detection is least reliable
  if (labels.length > 0) {
    const golfLabels = labels.filter(label => {
      const desc = label.description?.toLowerCase() || '';
      return desc.includes('golf') || desc.includes('club');
    });
    if (golfLabels.length > 0) {
      confidence += 0.1;
      totalWeight += 0.1;
    }
  }

  return totalWeight > 0 ? (confidence / totalWeight) * 100 : 0;
}

function estimateDistance(
  objects: LocalizedObject[],
  text: EntityAnnotation[]
): number {
  // Check for distance markers in text
  const distanceText = text.find(t => {
    const desc = t.description?.toLowerCase() || '';
    return desc.includes('yd') || desc.includes('yard') || desc.includes('meters');
  });

  if (distanceText?.description) {
    const match = distanceText.description.match(/\d+/);
    if (match) {
      return parseInt(match[0]);
    }
  }

  // Estimate based on object sizes and positions
  const golfObjects = objects.filter(obj => {
    const name = obj.name?.toLowerCase() || '';
    return name.includes('golf') || name.includes('club') || name.includes('ball');
  });

  if (golfObjects.length > 0) {
    const avgSize = golfObjects.reduce((sum, obj) => {
      const vertices = obj.boundingPoly?.normalizedVertices || [];
      if (vertices.length >= 2) {
        const width = vertices[1].x! - vertices[0].x!;
        const height = vertices[1].y! - vertices[0].y!;
        return sum + (width + height) / 2;
      }
      return sum;
    }, 0) / golfObjects.length;

    // Convert relative size to approximate distance
    return Math.round(200 * (1 - avgSize));
  }

  return 150; // Default distance
}

function analyzeTerrain(
  labels: EntityAnnotation[],
  objects: LocalizedObject[]
): string {
  // Check for specific terrain features
  const terrainLabels = labels.filter(label => {
    const desc = label.description?.toLowerCase() || '';
    return desc.includes('rough') ||
           desc.includes('fairway') ||
           desc.includes('bunker') ||
           desc.includes('sand') ||
           desc.includes('water') ||
           desc.includes('green');
  });

  const terrainObjects = objects.filter(obj => {
    const name = obj.name?.toLowerCase() || '';
    return name.includes('bunker') ||
           name.includes('water') ||
           name.includes('sand');
  });

  if (terrainLabels.some(label => label.description?.toLowerCase().includes('rough'))) {
    return 'rough';
  }
  if (terrainLabels.some(label => label.description?.toLowerCase().includes('bunker')) ||
      terrainObjects.some(obj => obj.name?.toLowerCase().includes('bunker'))) {
    return 'bunker';
  }
  if (terrainLabels.some(label => label.description?.toLowerCase().includes('fairway'))) {
    return 'fairway';
  }
  if (terrainLabels.some(label => label.description?.toLowerCase().includes('green'))) {
    return 'green';
  }
  return 'normal';
}

function estimateElevation(
  labels: EntityAnnotation[],
  objects: LocalizedObject[]
): number {
  // Check for elevation markers in labels
  const elevationLabels = labels.filter(label => {
    const desc = label.description?.toLowerCase() || '';
    return desc.includes('hill') ||
           desc.includes('slope') ||
           desc.includes('elevation') ||
           desc.includes('uphill') ||
           desc.includes('downhill');
  });

  if (elevationLabels.length > 0) {
    // Estimate elevation change based on number of elevation-related labels
    return elevationLabels.length * 5; // 5 feet per elevation marker
  }

  return 0; // Default elevation
}

function analyzeScene(
  labels: EntityAnnotation[],
  objects: LocalizedObject[]
): string {
  const golfObjects = objects.filter(obj => {
    const name = obj.name?.toLowerCase() || '';
    return name.includes('golf') || name.includes('club');
  });

  const golfLabels = labels.filter(label => {
    const desc = label.description?.toLowerCase() || '';
    return desc.includes('golf') || desc.includes('club');
  });

  if (golfObjects.length > 0 || golfLabels.length > 0) {
    return 'golf';
  }

  return 'unknown';
}

function getDefaultClub(scene: string): string {
  switch (scene) {
    case 'golf':
      return '7 Iron'; // Default club for general golf scenes
    default:
      return '7 Iron'; // Fallback default
  }
}

function generateReasoning(
  club: string,
  confidence: number,
  distance: number,
  terrain: string,
  elevation: number
): string {
  const reasons = [];

  if (confidence > 80) {
    reasons.push('High confidence in club identification');
  } else if (confidence > 50) {
    reasons.push('Moderate confidence in club identification');
  } else {
    reasons.push('Low confidence in club identification');
  }

  reasons.push(`Estimated distance: ${distance} yards`);
  reasons.push(`Terrain type: ${terrain}`);
  
  if (elevation > 0) {
    reasons.push(`Elevation change: ${elevation} feet uphill`);
  } else if (elevation < 0) {
    reasons.push(`Elevation change: ${Math.abs(elevation)} feet downhill`);
  }

  return reasons.join('. ');
} 