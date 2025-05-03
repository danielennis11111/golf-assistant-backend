# Golf Assistant Backend

Backend server for the Golf Assistant Pro application. Provides image analysis and club recommendations based on course conditions.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```env
PORT=3001
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json
```

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm run build
npm start
```

## API Endpoints

### POST /api/image-analysis/analyze
Analyzes a golf course image and returns recommendations.

Request:
- Multipart form data with 'image' field containing the image file

Response:
```json
{
  "distance": number,
  "elevation": number,
  "confidence": number,
  "terrain": string,
  "recommendation": {
    "club": string,
    "confidence": number,
    "reasoning": string
  }
}
```

### GET /health
Health check endpoint.

Response:
```json
{
  "status": "ok"
}
```
