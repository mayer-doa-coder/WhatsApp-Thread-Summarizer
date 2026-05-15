'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const uploadRoutes = require('./routes/uploadRoutes');
const summarizeRoutes = require('./routes/summarizeRoutes');
const replyRoutes = require('./routes/replyRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/reply', replyRoutes);

app.use(errorHandler);

module.exports = app;
