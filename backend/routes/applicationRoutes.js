const express = require('express');
const { createApplication } = require('../controllers/applicationController');
const { validateApplicationRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.post('/', validateApplicationRequest, createApplication);

module.exports = router;
