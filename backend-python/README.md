# Golf Assistant Backend

This is a FastAPI backend for the Golf Assistant application that uses Google Cloud Vision API for image analysis.

## Setup

1. Install Python 3.8 or higher
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up Google Cloud Vision API:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Cloud Vision API
   - Create a service account and download the JSON key file
   - Set the `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable with the contents of the JSON key file

## Running Locally

1. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

2. The server will be available at `http://localhost:8000`

## API Endpoints

- `POST /api/image-analysis`: Upload an image for analysis
- `GET /api/health`: Health check endpoint

## Deployment

This backend can be deployed to any platform that supports Python applications, such as:
- Render.com
- Heroku
- Google Cloud Run
- AWS Elastic Beanstalk

Make sure to set the `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable in your deployment platform. 