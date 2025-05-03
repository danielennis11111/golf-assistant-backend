import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { ImageAnalysisResult, TerrainType, AnalysisParameters } from '../types/imageAnalysis';
import fs from 'fs';
import path from 'path';

type LocalizedObject = protos.google.cloud.vision.v1.ILocalizedObjectAnnotation;
type Landmark = protos.google.cloud.vision.v1.IEntityAnnotation;

// Initialize the Google Cloud Vision client with credentials
let visionClient: ImageAnnotatorClient;
try {
  console.log('Current NODE_ENV:', process.env.NODE_ENV);
  
  if (process.env.NODE_ENV === 'production') {
    // In production, use credentials from environment variable
    console.log('Initializing Google Cloud Vision client in production mode');
    
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      throw new Error('Google Cloud Vision credentials not found in environment variables');
    }
    
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      console.log('Successfully parsed credentials JSON');
      visionClient = new ImageAnnotatorClient({ credentials });
    } catch (parseError) {
      console.error('Error parsing credentials JSON:', parseError);
      throw new Error('Failed to parse Google Cloud Vision credentials');
    }
  } else {
    // In development, use local key file
    console.log('Initializing Google Cloud Vision client in development mode');
    const keyFilePath = path.join(__dirname, '../../../server/keys/fabled-decker-458700-r9-717596d45345.json');
    
    console.log('Looking for credentials file at:', keyFilePath);
    if (!fs.existsSync(keyFilePath)) {
      console.error(`Credentials file not found at ${keyFilePath}`);
      // Fallback to environment variable if file not found
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        console.log('Falling back to credentials from environment variable');
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        visionClient = new ImageAnnotatorClient({ credentials });
      } else {
        throw new Error('Google Cloud Vision credentials not found');
      }
    } else {
      visionClient = new ImageAnnotatorClient({
        keyFilename: keyFilePath
      });
    }
  }
  
  console.log('Successfully initialized Google Cloud Vision client');
} catch (error) {
  console.error('Error initializing Google Cloud Vision client:', error);
  throw new Error('Failed to initialize image analysis service');
}

// ... rest of the file remains unchanged ... 