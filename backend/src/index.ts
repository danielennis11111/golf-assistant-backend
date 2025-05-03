import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRouter from './routes/upload';
import imageAnalysisRouter from './routes/imageAnalysis';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
<<<<<<< HEAD
  origin: [
    'https://ai-golf-assistant.surge.sh',
    'http://localhost:3000',
    'https://golf-assistant-pro.onrender.com'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
=======
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
>>>>>>> 474bd08c673ac8be9f3a5faea3a14679ab92e278
}));
app.use(express.json());

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/image-analysis', imageAnalysisRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 