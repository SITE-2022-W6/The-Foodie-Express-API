const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const security = require('./middleware/security');

const app = express();

app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());

app.use(security.extractUserFromJwt);

app.use('/auth', authRoutes);

app.get('/', async (req, res) => {
  res.status(200).json({ ping: 'pong' });
});

app.use((req, res, next) => {
  return next(new NotFoundError());
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message;
  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
