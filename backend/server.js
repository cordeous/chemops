require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/batches', require('./src/routes/batches'));
app.use('/api/customers', require('./src/routes/customers'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/compliance', require('./src/routes/compliance'));
app.use('/api/audit', require('./src/routes/audit'));
app.use('/api', require('./src/routes/importExport'));
app.use('/api/webhooks', require('./src/routes/webhooks'));
app.use('/api/admin', require('./src/routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Global error handler
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`ChemOps API running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
