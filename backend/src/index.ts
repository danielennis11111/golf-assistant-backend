import express from 'express';
import cors from 'cors';
import { imageAnalysisRouter } from './routes/imageAnalysis.js';
import dotenv from 'dotenv';
import { Server } from 'http';

// Load environment variables
dotenv.config();

console.log('Starting server with configuration:', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  hasGoogleCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  googleCredsLength: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.length || 0
});

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://golf-assistant.surge.sh'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/image-analysis', imageAnalysisRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV,
    hasGoogleCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
function startServer(): Promise<Server> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Attempting to start server on port ${port}...`);
      
      const server = app
        .listen(port, () => {
          console.log(`Server successfully bound to port ${port}`);
          console.log('Environment:', process.env.NODE_ENV);
          const corsOptions = app.get('cors');
          console.log('Allowed origins:', corsOptions ? corsOptions.origin : 'all');
          resolve(server);
        })
        .on('error', (error: NodeJS.ErrnoException) => {
          console.error('Server startup error:', error);
          if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use`);
          }
          reject(error);
        });

      // Additional error handling
      process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
      });

      process.on('unhandledRejection', (error) => {
        console.error('Unhandled Rejection:', error);
        process.exit(1);
      });

    } catch (error) {
      console.error('Error in server startup:', error);
      reject(error);
    }
  });
}

// Start the server
console.log('Initializing server...');
startServer()
  .then(() => {
    console.log('Server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  }); 