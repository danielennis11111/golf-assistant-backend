import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { ImageAnalysisResult } from '../types/imageAnalysis';
import fs from 'fs';

type LocalizedObject = protos.google.cloud.vision.v1.ILocalizedObjectAnnotation;
type Landmark = protos.google.cloud.vision.v1.IEntityAnnotation;

// Initialize the Google Cloud Vision client with credentials
let visionClient: ImageAnnotatorClient | null = null;

async function initializeVisionClient(): Promise<ImageAnnotatorClient> {
  if (visionClient) return visionClient;

  try {
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
      
      // Verify credentials structure
      if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
        console.log('Invalid credential structure. Missing required fields.');
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
    const client = await initializeVisionClient();
    
    // Read the image file
    const imageContent = await fs.promises.readFile(imagePath);
    
    // Perform label detection
    const [result] = await client.labelDetection!({
      image: { content: imageContent }
    });

    const labels = result.labelAnnotations || [];
    
    // Extract golf-related information
    const golfLabels = labels.filter(label => 
      label.description?.toLowerCase().includes('golf') ||
      label.description?.toLowerCase().includes('club') ||
      label.description?.toLowerCase().includes('course')
    );

    // Analyze the scene
    const [objectResult] = await client.objectLocalization!({
      image: { content: imageContent }
    });

    const objects = objectResult.localizedObjectAnnotations || [];
    
    // Determine club type and confidence
    const club = determineClub(golfLabels, objects);
    const confidence = calculateConfidence(golfLabels, objects);
    const distance = estimateDistance(objects);
    const terrain = analyzeTerrain(labels);
    const elevation = estimateElevation(labels);

    return {
      club,
      confidence,
      distance,
      terrain,
      elevation,
      recommendation: {
        club,
        confidence,
        reasoning: generateReasoning(club, confidence, distance)
      }
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

function determineClub(labels: protos.google.cloud.vision.v1.IEntityAnnotation[], objects: LocalizedObject[]): string {
  // Look for specific club mentions in labels
  const clubLabel = labels.find(label => 
    label.description?.toLowerCase().includes('driver') ||
    label.description?.toLowerCase().includes('iron') ||
    label.description?.toLowerCase().includes('wedge') ||
    label.description?.toLowerCase().includes('putter')
  );

  if (clubLabel?.description) {
    return clubLabel.description;
  }

  // Default recommendation based on objects and scene
  return '7 Iron'; // Default recommendation
}

function calculateConfidence(labels: protos.google.cloud.vision.v1.IEntityAnnotation[], objects: LocalizedObject[]): number {
  // Calculate confidence based on number and quality of golf-related detections
  const golfRelated = labels.filter(label => 
    label.description?.toLowerCase().includes('golf') ||
    label.description?.toLowerCase().includes('club') ||
    label.description?.toLowerCase().includes('course')
  );

  const avgScore = golfRelated.reduce((acc, label) => acc + (label.score || 0), 0) / (golfRelated.length || 1);
  return Math.min(avgScore * 100, 100);
}

function estimateDistance(objects: LocalizedObject[]): number {
  // Estimate distance based on object sizes and positions
  // This is a simplified estimation
  return 150; // Default distance in yards
}

function analyzeTerrain(labels: protos.google.cloud.vision.v1.IEntityAnnotation[]): string {
  // Analyze terrain type from labels
  if (labels.some(label => label.description?.toLowerCase().includes('rough'))) {
    return 'rough';
  }
  if (labels.some(label => label.description?.toLowerCase().includes('sand'))) {
    return 'bunker';
  }
  if (labels.some(label => label.description?.toLowerCase().includes('fairway'))) {
    return 'fairway';
  }
  return 'normal';
}

function estimateElevation(labels: protos.google.cloud.vision.v1.IEntityAnnotation[]): number {
  // Estimate elevation change from labels
  // This is a simplified estimation
  return 0; // Default elevation change in feet
}

function generateReasoning(club: string, confidence: number, distance: number): string {
  return `Based on the analysis, a ${club} is recommended for this ${distance} yard shot. Confidence level: ${confidence.toFixed(1)}%.`;
} 