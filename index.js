require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { query } = require('./db');
const { validateSubmission } = require('./middlewares/validation');

const app = express();

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Data submission endpoint
app.post('/api/submit', validateSubmission, async (req, res) => {
  const { name, email, data } = req.body;

  try {
    const result = await query(
      'INSERT INTO user_data (name, email, data) VALUES ($1, $2, $3) RETURNING *',
      [name, email, data]
    );

    res.status(201).json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    
    // Handle duplicate email error
    if (error.code === '23505') {
      return res.status(409).json({
        status: 'error',
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }

  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;