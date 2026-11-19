const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'AWS EKS GitHub Actions Pilot',
    application: 'Node.js REST API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'Running'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy'
  });
});

app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Application running on port ${PORT}`);
});
