import { ImageAnnotatorClient } from '@google-cloud/vision';

// Parse the JSON credentials from environment variable
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');

// Initialize the Vision API client with credentials
export const visionClient = new ImageAnnotatorClient({
  credentials,
}); 