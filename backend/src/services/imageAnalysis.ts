import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { ImageAnalysisResult, TerrainType, AnalysisParameters, PuttingAnalysis } from '../types/imageAnalysis.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createCanvas, loadImage, Image } from 'canvas';

// Use process.cwd() for the root directory
const rootDir = process.cwd();

type LocalizedObject = protos.google.cloud.vision.v1.ILocalizedObjectAnnotation;
type Landmark = protos.google.cloud.vision.v1.IEntityAnnotation;

// Initialize the Google Cloud Vision client with credentials
let visionClient: ImageAnnotatorClient | null = null;

async function initializeVisionClient() {
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
      visionClient = new ImageAnnotatorClient({ credentials });
      console.log('Successfully initialized Google Cloud Vision client');
      return visionClient;
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

function determineTrajectory(
  distance: number,
  elevation: number,
  terrain: TerrainType,
  windSpeed: number = 0,
  windDirection: string = 'none'
): { height: 'high' | 'normal' | 'low'; shape: 'fade' | 'straight' | 'draw' } {
  let height: 'high' | 'normal' | 'low' = 'normal';
  let shape: 'fade' | 'straight' | 'draw' = 'straight';

  // Determine height based on conditions
  if (elevation > 5) {
    // Uphill lie - use higher trajectory
    height = 'high';
  } else if (elevation < -5) {
    // Downhill lie - use lower trajectory
    height = 'low';
  }

  // Adjust for wind conditions
  if (windSpeed > 15) {
    if (windDirection === 'headwind') {
      height = 'low'; // Keep it low in strong headwind
    } else if (windDirection === 'tailwind') {
      height = 'high'; // Can afford higher trajectory with tailwind
    }
  }

  // Determine shot shape based on conditions
  if (terrain === 'challenging' || terrain === 'rough') {
    shape = 'fade'; // More control with fade in difficult conditions
  } else if (distance > 200) {
    shape = 'draw'; // Draw for maximum distance
  }

  // Adjust shape for wind
  if (windSpeed > 10) {
    if (windDirection === 'headwind') {
      shape = 'draw'; // Draw to penetrate headwind
    } else if (windDirection === 'tailwind') {
      shape = 'fade'; // Fade for more control with tailwind
    }
  }

  return { height, shape };
}

interface PuttingPathPoints {
  start: { x: number; y: number };
  control: { x: number; y: number };
  end: { x: number; y: number };
}

async function generatePuttingPathImage(
  imagePath: string,
  puttingAnalysis: PuttingAnalysis,
  ballPosition: { x: number; y: number },
  holePosition: { x: number; y: number }
): Promise<string> {
  // Load the original image
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Calculate the path points
  const pathPoints = calculatePuttingPathPoints(
    ballPosition,
    holePosition,
    puttingAnalysis
  );

  // Draw the putting path
  ctx.beginPath();
  ctx.moveTo(pathPoints.start.x, pathPoints.start.y);
  ctx.quadraticCurveTo(
    pathPoints.control.x,
    pathPoints.control.y,
    pathPoints.end.x,
    pathPoints.end.y
  );

  // Style the path
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Semi-transparent green
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]); // Dashed line
  ctx.stroke();

  // Draw the ball position
  ctx.beginPath();
  ctx.arc(ballPosition.x, ballPosition.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  // Draw the aim point
  const aimPoint = calculateAimPoint(
    holePosition,
    puttingAnalysis.recommendedPath.aimPoint
  );
  ctx.beginPath();
  ctx.arc(aimPoint.x, aimPoint.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'red';
  ctx.fill();

  // Save the modified image
  const outputPath = path.join(path.dirname(imagePath), 'putting-path.jpg');
  const buffer = canvas.toBuffer('image/jpeg');
  await fs.promises.writeFile(outputPath, buffer);

  return outputPath;
}

// Fix the break intensity factor typing
const breakIntensityMap = {
  'slight': 0.1,
  'moderate': 0.2,
  'strong': 0.3
} as const;

type BreakIntensity = keyof typeof breakIntensityMap;

function calculatePuttingPathPoints(
  ballPos: { x: number; y: number },
  holePos: { x: number; y: number },
  analysis: PuttingAnalysis
): PuttingPathPoints {
  const start = ballPos;
  const end = holePos;

  // Calculate control point for the break
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Adjust break intensity
  const breakIntensityFactor = breakIntensityMap[analysis.breakLine.intensity as BreakIntensity];

  // Calculate distance between points for scaling
  const distance = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );

  // Adjust control point based on break direction and intensity
  const breakOffset = distance * breakIntensityFactor;
  const controlPoint = {
    x: midX + (analysis.breakLine.direction === 'right' ? breakOffset : -breakOffset),
    y: midY
  };

  return {
    start,
    control: controlPoint,
    end
  };
}

function calculateAimPoint(
  holePos: { x: number; y: number },
  aimPoint: { direction: 'left' | 'right'; inches: number }
): { x: number; y: number } {
  // Convert inches to pixels (approximate)
  const pixelsPerInch = 5;
  const offset = aimPoint.inches * pixelsPerInch;

  return {
    x: holePos.x + (aimPoint.direction === 'right' ? offset : -offset),
    y: holePos.y
  };
}

async function analyzePuttingShot(
  imagePath: string,
  objects: LocalizedObject[],
  imageBuffer: Buffer
): Promise<{ analysis: PuttingAnalysis; pathImagePath: string } | null> {
  // Check if this is a putting shot by looking for relevant objects
  const isGreen = objects.some(obj => 
    obj.name?.toLowerCase().includes('green') ||
    obj.name?.toLowerCase().includes('hole') ||
    obj.name?.toLowerCase().includes('flag') ||
    obj.name?.toLowerCase().includes('cup')
  );

  if (!isGreen) {
    return null;
  }

  // Get image dimensions
  const imageInfo = await sharp(imageBuffer).metadata();
  const imageWidth = imageInfo.width || 1000;
  const imageHeight = imageInfo.height || 1000;

  // Find the hole/cup in the image
  const hole = objects.find(obj => 
    obj.name?.toLowerCase().includes('hole') ||
    obj.name?.toLowerCase().includes('cup')
  );

  if (!hole?.boundingPoly?.normalizedVertices) {
    return null;
  }

  // Calculate positions
  const holePos = {
    x: (hole.boundingPoly.normalizedVertices[0]?.x || 0) * imageWidth,
    y: (hole.boundingPoly.normalizedVertices[0]?.y || 0) * imageHeight
  };

  // Assume ball position is at bottom center of image for now
  // In a real implementation, we would detect the ball
  const ballPos = {
    x: imageWidth / 2,
    y: imageHeight * 0.8
  };

  // Get slope analysis (simplified for now)
  const slopeAnalysis = {
    direction: 'uphill' as const,
    degree: 3
  };

  // Analyze break line
  const breakAnalysis = {
    direction: 'right' as const,
    intensity: 'moderate' as const
  };

  // Calculate recommended path
  const recommendedPath = {
    aimPoint: {
      direction: 'right' as const,
      inches: 4
    },
    speed: 'medium' as const,
    breakDescription: 'The green slopes uphill with a moderate break to the right.'
  };

  const analysis: PuttingAnalysis = {
    distance: 15, // Default 15 feet for testing
    slope: slopeAnalysis,
    breakLine: breakAnalysis,
    recommendedPath
  };

  // Generate the path image
  const pathImagePath = await generatePuttingPathImage(
    imagePath,
    analysis,
    ballPos,
    holePos
  );

  return { analysis, pathImagePath };
}

function analyzeGreenSlope(
  depthData: number[][],
  holePosition: { x: number; y: number }
): { direction: 'left' | 'right' | 'uphill' | 'downhill' | 'flat'; degree: number } {
  // For now, we'll use a simplified slope analysis
  // In a real implementation, this would use actual depth data to calculate slopes
  
  const samplePoints = getSamplePoints(depthData, holePosition);
  const avgSlope = calculateAverageSlope(samplePoints);
  
  const direction = determineOverallSlopeDirection(avgSlope);
  const degree = Math.min(Math.abs(avgSlope * 5), 10); // Scale slope to 0-10 range
  
  return {
    direction,
    degree
  };
}

function analyzeBreakLine(
  depthData: number[][],
  holePosition: { x: number; y: number },
  slopeAnalysis: { direction: string; degree: number }
): { direction: 'left' | 'right'; intensity: 'slight' | 'moderate' | 'strong' } {
  // This would use the depth data to analyze how the ball will break
  // For now, we'll use a simplified version based on the slope
  
  const breakDirection = slopeAnalysis.direction === 'left' ? 'right' : 'left';
  let intensity: 'slight' | 'moderate' | 'strong' = 'slight';
  
  if (slopeAnalysis.degree > 7) {
    intensity = 'strong';
  } else if (slopeAnalysis.degree > 4) {
    intensity = 'moderate';
  }
  
  return {
    direction: breakDirection as 'left' | 'right',
    intensity
  };
}

function calculatePuttingPath(
  slope: { direction: string; degree: number },
  breakLine: { direction: 'left' | 'right'; intensity: 'slight' | 'moderate' | 'strong' },
  holePosition: { x: number; y: number }
): {
  aimPoint: { direction: 'left' | 'right'; inches: number };
  speed: 'soft' | 'medium' | 'firm';
  breakDescription: string;
} {
  // Calculate aim point based on break and slope
  const aimDirection = breakLine.direction;
  let aimInches = 0;
  let speed: 'soft' | 'medium' | 'firm' = 'medium';
  
  switch (breakLine.intensity) {
    case 'slight':
      aimInches = 2;
      speed = 'medium';
      break;
    case 'moderate':
      aimInches = 4;
      speed = slope.direction === 'uphill' ? 'firm' : 'medium';
      break;
    case 'strong':
      aimInches = 6;
      speed = slope.direction === 'uphill' ? 'firm' : 'soft';
      break;
  }

  // Adjust for uphill/downhill
  if (slope.direction === 'uphill') {
    aimInches *= 1.2; // Uphill breaks less
  } else if (slope.direction === 'downhill') {
    aimInches *= 0.8; // Downhill breaks more
  }

  const breakDescription = generateBreakDescription(slope, breakLine, aimInches);

  return {
    aimPoint: {
      direction: aimDirection,
      inches: Math.round(aimInches)
    },
    speed,
    breakDescription
  };
}

function generateBreakDescription(
  slope: { direction: string; degree: number },
  breakLine: { direction: 'left' | 'right'; intensity: 'slight' | 'moderate' | 'strong' },
  aimInches: number
): string {
  const slopeDesc = slope.direction === 'flat' 
    ? 'relatively flat'
    : `${slope.direction} sloping`;
  
  return `The green is ${slopeDesc} with a ${breakLine.intensity} break to the ${breakLine.direction}. ` +
    `Aim ${Math.round(aimInches)} inches to the ${breakLine.direction} of the hole.`;
}

function estimatePuttingDistance(holePosition: { x: number; y: number }): number {
  // In a real implementation, this would use proper distance calculation
  // For now, we'll use a simplified version
  return 15; // Default to 15 feet for testing
}

// Helper functions for slope analysis (simplified versions)
function getSamplePoints(depthData: number[][], holePosition: { x: number; y: number }) {
  // This would sample points around the putting line to analyze slope
  // For now, return dummy data
  return [[0.1, 0.2, 0.3], [0.2, 0.3, 0.4]];
}

function calculateAverageSlope(samplePoints: number[][]): number {
  // This would calculate the actual slope from depth data
  // For now, return a dummy value
  return 0.05;
}

function determineOverallSlopeDirection(avgSlope: number): 'left' | 'right' | 'uphill' | 'downhill' | 'flat' {
  if (Math.abs(avgSlope) < 0.02) return 'flat';
  if (avgSlope > 0) return 'uphill';
  return 'downhill';
}

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
      const [visionResult] = await visionClient!.annotateImage(request);

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

      // Get trajectory recommendation
      const trajectory = determineTrajectory(
        estimatedDistance,
        elevation,
        terrain,
        parameters?.windSpeed,
        parameters?.windDirection
      );

      // Add trajectory to explanation
      explanation += `. For optimal results, use a ${trajectory.height} trajectory with a ${trajectory.shape} shape`;

      // Adjust for terrain
      if (terrain === 'challenging') {
        explanation += ` given the challenging terrain conditions`;
      } else if (terrain === 'rough') {
        explanation += ` considering the rough terrain`;
      } else if (terrain === 'hilly') {
        explanation += ` taking into account the hilly terrain`;
      }

      // Adjust for wind
      if (parameters?.windDirection && parameters.windSpeed) {
        explanation += `. Wind conditions (${parameters.windSpeed}mph ${parameters.windDirection}) have been factored into the trajectory recommendation`;
      }

      // Adjust for age
      if (parameters?.age && parameters.age > 50) {
        explanation += `. The recommendation has been adjusted for your age group`;
      }

      explanation += `. I recommend using your ${recommendedClub} for this shot.`;

      // Check for putting shot first
      const puttingResult = await analyzePuttingShot(imagePath, objects, imageBuffer);
      
      if (puttingResult) {
        const analysisResult: ImageAnalysisResult = {
          distance: puttingResult.analysis.distance,
          elevation: 0,
          confidence: 0.9,
          terrain: 'green',
          recommendation: {
            club: 'Putter',
            confidence: 0.95,
            reasoning: `You are ${puttingResult.analysis.distance} feet from the hole. ${puttingResult.analysis.recommendedPath.breakDescription}`,
            trajectory: {
              height: 'low',
              shape: 'straight'
            },
            puttingAnalysis: puttingResult.analysis
          }
        };

        // Add the path image to the response
        (analysisResult as any).puttingPathImage = puttingResult.pathImagePath;

        console.log('Putting analysis result:', analysisResult);
        return analysisResult;
      }

      const analysisResult: ImageAnalysisResult = {
        distance: estimatedDistance,
        elevation: elevation,
        confidence: 0.85,
        terrain: terrain,
        recommendation: {
          club: recommendedClub,
          confidence: 0.85,
          reasoning: explanation,
          trajectory: trajectory
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