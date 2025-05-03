import express from 'express';
import { json } from 'body-parser';

const app = express();
const port = process.env.PORT || 3001;

app.use(json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
}); 