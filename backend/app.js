const express = require('express');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const { createHttpError, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (request, response) => {
  response.json({
    status: 'success',
    data: { service: 'internhub-api', database: 'sqlite' },
    pagination: null
  });
});
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use((request, response, next) => {
  next(createHttpError(404, 'API endpoint not found'));
});
app.use(errorHandler);

module.exports = app;
