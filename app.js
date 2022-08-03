const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const { NotFoundError } = require('./utils/errors')

const authRoutes = require('./routes/auth')
const menuRoutes = require('./routes/menu')
const restaruantRoutes = require('./routes/restaurant')
const reviewRoutes = require('./routes/review')
const preferenceRoutes = require('./routes/preference')
const security = require('./middleware/security')

const app = express()

app.use(cors())
app.use(morgan('tiny'))
app.use(express.json())

app.use(security.extractUserFromJwt)

app.use('/auth', authRoutes)
app.use('/menu', menuRoutes)
app.use('/restaurant', restaruantRoutes)
app.use('/review', reviewRoutes)
app.use('/preference', preferenceRoutes)
app.get('/', async (req, res) => {
  res.status(200).json({ ping: 'pong' })
})

app.use((req, res, next) => {
  return next(new NotFoundError())
})

app.use((err, req, res, next) => {
  const status = err.status || 500
  const message = err.message
  return res.status(status).json({
    error: { message, status },
  })
})

module.exports = app
