import express from 'express';
import cors from 'cors';
import { imageAnalysisRouter } from './routes/imageAnalysis.js';
import dotenv from 'dotenv';
import { Server } from 'http';

// Load environment variables
dotenv.config();

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
  res.json({ status: 'ok' });
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
async function startServer() {
  try {
    let server: Server | null = null;

    // Create server with proper error handling
    server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log('Environment:', process.env.NODE_ENV);
      const corsOptions = app.get('cors');
      console.log('Allowed origins:', corsOptions ? corsOptions.origin : 'all');
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${port} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${port} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 