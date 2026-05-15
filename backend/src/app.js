'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const uploadRoutes = require('./routes/uploadRoutes');
const summarizeRoutes = require('./routes/summarizeRoutes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/summarize', summarizeRoutes);

module.exports = app;
