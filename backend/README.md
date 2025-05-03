# Golf Assistant Backend

This is the backend service for Golf Assistant Pro, providing image analysis and golf shot recommendations using Google Cloud Vision API.

## Prerequisites

- Node.js >= 18.0.0
- npm
- Google Cloud Vision API credentials

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   For Development:
   ```env
   # Server Configuration
   PORT=3001  # Optional, defaults to 3001
   NODE_ENV=development

   # Google Cloud Vision API Credentials
   # This should be a JSON string containing your service account credentials
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type": "service_account", "project_id": "your-project-id", ...}
   
   # CORS Configuration - Include all development and production URLs
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002,https://ai-golf-assistant.surge.sh
   ```

   For Production:
   ```env
   # Server Configuration
   NODE_ENV=production
   # PORT is typically provided by the hosting platform (e.g., Render.com)

   # Google Cloud Vision API Credentials
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type": "service_account", "project_id": "your-project-id", ...}

   # CORS Configuration - Only include your production frontend URL
   ALLOWED_ORIGINS=https://ai-golf-assistant.surge.sh
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Endpoints

### POST /api/image-analysis/analyze
Analyzes a golf course image and provides shot recommendations.

Request:
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - image: File (JPEG/PNG/HEIC, max 10MB)

Response:
```json
{
  "terrain": {
    "type": "flat" | "rough" | "hilly" | "challenging",
    "slope": number,
    "roughness": number
  },
  "recommendations": {
    "club": string,
    "confidence": number,
    "reasoning": string
  }
}
```

### GET /api/health
Health check endpoint to verify server status.

Response:
```json
{
  "status": "ok",
  "environment": string,
  "hasGoogleCreds": boolean
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- 400: Bad Request (invalid input)
- 500: Internal Server Error

All errors include a JSON response with:
```json
{
  "error": string
}
```

## Deployment Notes

1. **PORT**: In production environments (like Render.com), do not set the PORT environment variable. The platform will provide it automatically, and our application will use that value.

2. **ALLOWED_ORIGINS**: In production, only include your production frontend URL(s). Remove any development URLs (localhost) to maintain security.

3. **NODE_ENV**: Always set this to "production" in production environments to enable optimizations and disable development-only features. 