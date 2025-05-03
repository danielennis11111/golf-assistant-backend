from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
import os
import json
import tempfile
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS - only allow your Surge domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-golf-assistant.surge.sh"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Cloud Vision client
def get_vision_client():
    try:
        logger.debug("Attempting to initialize Vision client...")
        # Get credentials from environment variable
        credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
        logger.debug(f"Credentials present: {bool(credentials_json)}")
        
        if not credentials_json:
            logger.error("No credentials found in environment variables")
            raise ValueError("Google Cloud credentials not found in environment variables")
        
        try:
            # Parse credentials
            credentials = json.loads(credentials_json)
            logger.debug("Successfully parsed credentials JSON")
            
            # Verify required fields
            required_fields = ['project_id', 'private_key', 'client_email']
            missing_fields = [field for field in required_fields if field not in credentials]
            if missing_fields:
                logger.error(f"Missing required fields in credentials: {missing_fields}")
                raise ValueError(f"Missing required fields in credentials: {missing_fields}")
            
            # Create client with credentials
            logger.debug(f"Creating Vision client with project: {credentials['project_id']}")
            client = vision.ImageAnnotatorClient.from_service_account_info(credentials)
            logger.debug("Successfully initialized Vision client")
            return client
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse credentials JSON: {str(e)}")
            raise ValueError("Invalid JSON in credentials")
    except Exception as e:
        logger.error(f"Error initializing Vision client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize Vision client: {str(e)}")

@app.post("/api/image-analysis")
async def analyze_image(file: UploadFile = File(...)):
    try:
        logger.debug("Received image upload request")
        # Get Vision client
        client = get_vision_client()
        
        # Read the uploaded file
        logger.debug("Reading uploaded file")
        content = await file.read()
        logger.debug(f"File size: {len(content)} bytes")
        
        # Create Vision image
        logger.debug("Creating Vision image")
        image = vision.Image(content=content)
        
        # Perform label detection
        logger.debug("Performing label detection")
        response = client.label_detection(image=image)
        labels = response.label_annotations
        logger.debug(f"Detected {len(labels)} labels")
        
        # Extract golf-related information
        golf_labels = [label for label in labels if 
                     'golf' in label.description.lower() or 
                     'club' in label.description.lower() or 
                     'course' in label.description.lower()]
        logger.debug(f"Found {len(golf_labels)} golf-related labels")
        
        # Determine club type
        club = "7 Iron"  # Default
        for label in labels:
            desc = label.description.lower()
            if 'driver' in desc:
                club = "Driver"
                break
            elif 'iron' in desc:
                club = "Iron"
                break
            elif 'wedge' in desc:
                club = "Wedge"
                break
            elif 'putter' in desc:
                club = "Putter"
                break
        
        # Calculate confidence
        confidence = 0
        if golf_labels:
            confidence = sum(label.score for label in golf_labels) / len(golf_labels) * 100
        
        logger.debug(f"Analysis complete. Club: {club}, Confidence: {confidence}%")
        
        # Return analysis results
        return {
            "club": club,
            "confidence": confidence,
            "distance": 150,  # Default distance
            "terrain": "normal",
            "elevation": 0,
            "recommendation": {
                "club": club,
                "confidence": confidence,
                "reasoning": f"Based on the analysis, a {club} is recommended for this 150 yard shot. Confidence level: {confidence:.1f}%."
            }
        }
            
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@app.get("/api/health")
async def health_check():
    logger.debug("Health check requested")
    return {"status": "ok"} 