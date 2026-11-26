const express = require('express');
const {
  createInternship,
  deleteInternship,
  getInternship,
  listInternships,
  updateInternship
} = require('../controllers/internshipController');
const {
  validateInternshipQuery,
  validateInternshipRequest
} = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', validateInternshipQuery, listInternships);
router.get('/:id', getInternship);
router.post('/', validateInternshipRequest({ requireId: true }), createInternship);
router.put('/:id', validateInternshipRequest(), updateInternship);
router.delete('/:id', deleteInternship);

module.exports = router;
