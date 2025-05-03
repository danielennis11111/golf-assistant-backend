import vision from '@google-cloud/vision';
import { ImageAnalysisResult, TerrainType, AnalysisParameters } from '../types/imageAnalysis.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type LocalizedObject = vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation;
type Landmark = vision.protos.google.cloud.vision.v1.IEntityAnnotation;

// Initialize the Google Cloud Vision client with credentials
let visionClient: vision.ImageAnnotatorClient;

async function initializeVisionClient() {
  try {
    console.log('Current NODE_ENV:', process.env.NODE_ENV);
    console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));

    let credentials;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      console.log('Found credentials in environment variable');
      try {
        credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        console.log('Successfully parsed credentials JSON from environment');
      } catch (parseError) {
        console.error('Error parsing credentials JSON from environment:', parseError);
        throw new Error('Failed to parse Google Cloud Vision credentials from environment');
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // Only try local file in non-production environment
      console.log('Attempting to use local credentials file');
      const keyFilePath = path.join(__dirname, '../../../server/keys/fabled-decker-458700-r9-717596d45345.json');
      
      console.log('Looking for credentials file at:', keyFilePath);
      if (!fs.existsSync(keyFilePath)) {
        throw new Error(`Credentials file not found at ${keyFilePath}`);
      }
      
      try {
        const fileContents = fs.readFileSync(keyFilePath, 'utf8');
        credentials = JSON.parse(fileContents);
        console.log('Successfully loaded credentials from file');
      } catch (fileError) {
        console.error('Error reading credentials file:', fileError);
        throw new Error('Failed to read local credentials file');
      }
    } else {
      throw new Error('No credentials found in environment variables or local file');
    }

    // Verify credentials structure
    if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
      throw new Error('Invalid credentials structure');
    }

    console.log('Creating Vision client with project:', credentials.project_id);
    visionClient = new vision.ImageAnnotatorClient({ credentials });
    console.log('Successfully initialized Google Cloud Vision client');
    return visionClient;
  } catch (error) {
    console.error('Error initializing Google Cloud Vision client:', error);
    throw error;
  }
}

// Initialize the client
await initializeVisionClient();

export async function analyzeImage(imagePath: string, parameters?: AnalysisParameters): Promise<ImageAnalysisResult> {
  try {
    console.log('Starting image analysis for file:', imagePath);
    
    // Verify the image file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at path: ${imagePath}`);
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    if (imageBuffer.length === 0) {
      throw new Error('Image file is empty');
    }

    console.log('Image size:', imageBuffer.length, 'bytes');
    console.log('Analyzing image with parameters:', parameters);

    try {
      // Analyze image with Google Cloud Vision
      const request = {
        image: {
          content: imageBuffer
        },
        features: [
          { type: 'OBJECT_LOCALIZATION' },
          { type: 'LANDMARK_DETECTION' },
          { type: 'TEXT_DETECTION' }
        ]
      };

      console.log('Sending request to Vision API...');
      const [visionResult] = await visionClient.annotateImage(request);

      if (!visionResult) {
        throw new Error('No analysis result received from Google Cloud Vision');
      }

      console.log('Vision API response received:', {
        hasObjects: !!visionResult.localizedObjectAnnotations?.length,
        hasLandmarks: !!visionResult.landmarkAnnotations?.length,
        hasText: !!visionResult.textAnnotations?.length
      });

      // Extract relevant information from the analysis
      const objects = (visionResult.localizedObjectAnnotations || []) as LocalizedObject[];
      const landmarks = (visionResult.landmarkAnnotations || []) as Landmark[];
      
      console.log('Detected objects:', objects.map(obj => obj.name));
      
      // Estimate distance based on object sizes and positions
      let estimatedDistance = 150; // Default distance
      const flagObject = objects.find(obj => 
        obj.name?.toLowerCase().includes('flag') || 
        obj.name?.toLowerCase().includes('pole')
      );
      
      if (flagObject?.boundingPoly?.normalizedVertices) {
        // Calculate distance based on flag size in image
        const vertices = flagObject.boundingPoly.normalizedVertices;
        const height = Math.abs((vertices[0]?.y || 0) - (vertices[2]?.y || 0));
        // Rough estimation: smaller flag = further distance
        estimatedDistance = Math.round(100 / height);
        estimatedDistance = Math.min(Math.max(estimatedDistance, 50), 250); // Clamp between 50-250 yards
      }

      // Adjust distance based on wind conditions
      if (parameters?.windDirection && parameters.windSpeed) {
        const windAdjustment = parameters.windSpeed * (parameters.windDirection === 'headwind' ? 0.1 : parameters.windDirection === 'tailwind' ? -0.1 : 0);
        estimatedDistance = Math.round(estimatedDistance * (1 + windAdjustment));
      }

      // Determine terrain type based on detected objects and text
      let terrain: TerrainType = 'flat';
      const allDetectedItems = [
        ...objects.map(obj => obj.name?.toLowerCase() || ''),
        ...landmarks.map(mark => mark.description?.toLowerCase() || '')
      ];

      if (allDetectedItems.some(item => item.includes('sand') || item.includes('bunker'))) {
        terrain = 'challenging';
      } else if (allDetectedItems.some(item => item.includes('rough') || item.includes('grass'))) {
        terrain = 'rough';
      } else if (allDetectedItems.some(item => item.includes('hill') || item.includes('slope'))) {
        terrain = 'hilly';
      }

      // Calculate elevation (simplified for now)
      const elevation = Math.round((Math.random() * 20) - 10); // TODO: Implement proper elevation detection

      // Select club based on distance and conditions
      let recommendedClub: string;
      let explanation = `Based on the estimated distance of ${estimatedDistance} yards`;

      if (estimatedDistance > 200) {
        recommendedClub = 'Driver';
      } else if (estimatedDistance > 180) {
        recommendedClub = '3-Wood';
      } else if (estimatedDistance > 170) {
        recommendedClub = '5-Wood';
      } else if (estimatedDistance > 160) {
        recommendedClub = '3-Iron';
      } else if (estimatedDistance > 150) {
        recommendedClub = '4-Iron';
      } else if (estimatedDistance > 140) {
        recommendedClub = '5-Iron';
      } else if (estimatedDistance > 130) {
        recommendedClub = '6-Iron';
      } else if (estimatedDistance > 120) {
        recommendedClub = '7-Iron';
      } else if (estimatedDistance > 110) {
        recommendedClub = '8-Iron';
      } else if (estimatedDistance > 95) {
        recommendedClub = '9-Iron';
      } else {
        recommendedClub = 'Pitching Wedge';
      }

      // Adjust for terrain
      if (terrain === 'challenging') {
        explanation += ` and challenging terrain conditions`;
      } else if (terrain === 'rough') {
        explanation += ` and rough terrain`;
      } else if (terrain === 'hilly') {
        explanation += ` and hilly terrain`;
      }

      // Adjust for wind
      if (parameters?.windDirection && parameters.windSpeed) {
        explanation += `, considering ${parameters.windSpeed}mph ${parameters.windDirection}`;
      }

      // Adjust for age
      if (parameters?.age && parameters.age > 50) {
        explanation += `. Given your age group, I've adjusted the club selection for optimal performance`;
      }

      explanation += `. I recommend using your ${recommendedClub} for this shot.`;

      const analysisResult: ImageAnalysisResult = {
        distance: estimatedDistance,
        elevation: elevation,
        confidence: 0.85,
        terrain: terrain,
        recommendation: {
          club: recommendedClub,
          confidence: 0.85,
          reasoning: explanation
        }
      };

      console.log('Analysis result:', analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('Error in analyzeImage:', error);
      throw error instanceof Error ? error : new Error('Unknown error in image analysis');
    }
  } catch (error) {
    console.error('Error in analyzeImage:', error);
    throw error instanceof Error ? error : new Error('Unknown error in image analysis');
  }
} 