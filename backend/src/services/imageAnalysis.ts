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
  console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
  
  // Try to use environment variable first, regardless of environment
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    console.log('Found credentials in environment variable');
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      console.log('Successfully parsed credentials JSON, project_id:', credentials.project_id);
      visionClient = new ImageAnnotatorClient({ credentials });
    } catch (parseError) {
      console.error('Error parsing credentials JSON:', parseError);
      throw new Error('Failed to parse Google Cloud Vision credentials');
    }
  } else if (process.env.NODE_ENV !== 'production') {
    // Only try local file in non-production environment
    console.log('Attempting to use local credentials file');
    const keyFilePath = path.join(__dirname, '../../../server/keys/fabled-decker-458700-r9-717596d45345.json');
    
    console.log('Looking for credentials file at:', keyFilePath);
    if (!fs.existsSync(keyFilePath)) {
      console.error(`Credentials file not found at ${keyFilePath}`);
      throw new Error('Google Cloud Vision credentials not found');
    }
    
    try {
      const fileContents = fs.readFileSync(keyFilePath, 'utf8');
      const credentials = JSON.parse(fileContents);
      console.log('Successfully loaded credentials from file, project_id:', credentials.project_id);
      visionClient = new ImageAnnotatorClient({ credentials });
    } catch (fileError) {
      console.error('Error reading credentials file:', fileError);
      throw new Error('Failed to read local credentials file');
    }
  } else {
    throw new Error('No credentials found in environment variables or local file');
  }
  
  console.log('Successfully initialized Google Cloud Vision client');
} catch (error) {
  console.error('Error initializing Google Cloud Vision client:', error);
  throw new Error('Failed to initialize image analysis service');
}

// ... rest of the file remains unchanged ... 