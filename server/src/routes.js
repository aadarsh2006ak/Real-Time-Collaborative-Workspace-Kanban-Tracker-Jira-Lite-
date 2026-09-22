// server/src/routes.js
const { Router } = require('express');

const router = Router();

// Base info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Jira-Lite API',
      version: '1.0.0',
      status: 'operational',
      docs: '/api/v1/docs',
    },
  });
});

module.exports = router;
