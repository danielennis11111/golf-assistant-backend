import express from 'express';
import cors from 'cors';
import { imageAnalysisRouter } from './routes/imageAnalysis.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://golf-assistant.surge.sh'
  ]
}));

app.use(express.json());

// Routes
app.use('/api/image-analysis', imageAnalysisRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
try {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 