import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { imageAnalysisRouter } from './routes/imageAnalysis';

// Load environment variables
dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3002'
];

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// Routes
app.use('/api/image-analysis', imageAnalysisRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
function startServer() {
  return new Promise((resolve, reject) => {
    try {
      logger.info(`Attempting to start server on port ${port}...`);
      
      const server = createServer(app);
      
      server.listen(port, () => {
        logger.info(`Server successfully bound to port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Allowed origins: ${allowedOrigins}`);
        resolve(server);
      });
      
      server.on('error', (error: NodeJS.ErrnoException) => {
        logger.error('Server startup error:', error);
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${port} is already in use`);
        }
        reject(error);
      });

      // Additional error handling
      process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        process.exit(1);
      });

      process.on('unhandledRejection', (error) => {
        logger.error('Unhandled Rejection:', error);
        process.exit(1);
      });

    } catch (error) {
      logger.error('Error in server startup:', error);
      reject(error);
    }
  });
}

// Start the server
logger.info('Initializing server...');
startServer()
  .then(() => {
    logger.info('Server started successfully');
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }); 