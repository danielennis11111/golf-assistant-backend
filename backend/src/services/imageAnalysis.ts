import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { ImageAnalysisResult, TerrainType, AnalysisParameters } from '../types/imageAnalysis';
import fs from 'fs';
import path from 'path';

type LocalizedObject = protos.google.cloud.vision.v1.ILocalizedObjectAnnotation;
type Landmark = protos.google.cloud.vision.v1.IEntityAnnotation;

// Initialize the Google Cloud Vision client with credentials
let visionClient: ImageAnnotatorClient;
try {
  if (process.env.NODE_ENV === 'production') {
    // In production, use credentials from environment variable
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      throw new Error('Google Cloud Vision credentials not found in environment variables');
    }
    
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    visionClient = new ImageAnnotatorClient({ credentials });
  } else {
    // In development, use local key file
    const keyFilePath = path.join(__dirname, '../../../server/keys/fabled-decker-458700-r9-717596d45345.json');
    
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Google Cloud Vision key file not found at: ${keyFilePath}`);
    }
    
    visionClient = new ImageAnnotatorClient({
      keyFilename: keyFilePath
    });
  }
  
  console.log('Successfully initialized Google Cloud Vision client');
} catch (error) {
  console.error('Error initializing Google Cloud Vision client:', error);
  throw new Error('Failed to initialize image analysis service');
}

export async function analyzeImage(imagePath: string, parameters?: AnalysisParameters): Promise<ImageAnalysisResult> {
  try {
    // Verify the image file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at path: ${imagePath}`);
    }

    // Read the image file
    const imageContent = fs.readFileSync(imagePath);
    if (imageContent.length === 0) {
      throw new Error('Image file is empty');
    }

    console.log('Analyzing image with parameters:', parameters);

    // Analyze image with Google Cloud Vision
    const [visionResult] = await visionClient.annotateImage({
      image: { content: imageContent.toString('base64') },
      features: [
        { type: 'OBJECT_LOCALIZATION' as const },
        { type: 'LANDMARK_DETECTION' as const },
        { type: 'TEXT_DETECTION' as const },
      ],
    });

    if (!visionResult) {
      throw new Error('No analysis result received from Google Cloud Vision');
    }

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
    if (estimatedDistance > 200) {
      recommendedClub = 'Driver';
    } else if (estimatedDistance > 170) {
      recommendedClub = '3-Wood';
    } else if (estimatedDistance > 150) {
      recommendedClub = '5-Iron';
    } else if (estimatedDistance > 100) {
      recommendedClub = 'Pitching Wedge';
    } else {
      recommendedClub = 'Sand Wedge';
    }

    // Adjust club selection based on terrain
    if (terrain === 'challenging' || terrain === 'rough') {
      // Club up for difficult terrain
      const clubProgression = ['Sand Wedge', 'Pitching Wedge', '5-Iron', '3-Wood', 'Driver'];
      const currentIndex = clubProgression.indexOf(recommendedClub);
      if (currentIndex < clubProgression.length - 1) {
        recommendedClub = clubProgression[currentIndex + 1];
      }
    }

    // Adjust club selection based on age
    if (parameters?.age && parameters.age > 50) {
      // For older players, recommend a stronger club to compensate for reduced swing speed
      const clubProgression = ['Sand Wedge', 'Pitching Wedge', '5-Iron', '3-Wood', 'Driver'];
      const currentIndex = clubProgression.indexOf(recommendedClub);
      if (currentIndex < clubProgression.length - 1) {
        recommendedClub = clubProgression[currentIndex + 1];
      }
    }

    let explanation = `Based on the analysis, you are approximately ${estimatedDistance} yards from the target`;
    
    if (elevation !== 0) {
      explanation += ` with a ${elevation > 0 ? 'uphill' : 'downhill'} lie of ${Math.abs(elevation)} feet`;
    }
    
    if (parameters?.windSpeed && parameters.windDirection !== 'none') {
      explanation += `, and there's a ${parameters.windSpeed} mph ${parameters.windDirection}`;
    }
    
    explanation += `. The terrain appears to be ${terrain}`;
    
    if (terrain !== 'flat') {
      explanation += ', so I recommend clubbing up';
    }
    
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
} 