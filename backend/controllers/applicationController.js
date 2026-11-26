const database = require('../database/connection');
const { createHttpError } = require('../middleware/errorHandler');

function createApplication(request, response, next) {
  try {
    const application = request.validatedApplication;
    const internship = database.prepare(`
      SELECT id, applications_open
      FROM internships
      WHERE id = ?
    `).get(application.internship_id);

    if (!internship) {
      throw createHttpError(404, 'Internship not found');
    }
    if (!internship.applications_open) {
      throw createHttpError(409, 'Applications are closed for this internship');
    }

    const duplicate = database.prepare(`
      SELECT id FROM applications
      WHERE internship_id = ? AND applicant_email = ?
    `).get(application.internship_id, application.applicant_email);
    if (duplicate) {
      throw createHttpError(409, 'An application already exists for this internship and email');
    }

    const result = database.prepare(`
      INSERT INTO applications (internship_id, applicant_name, applicant_email)
      VALUES (?, ?, ?)
    `).run(
      application.internship_id,
      application.applicant_name,
      application.applicant_email
    );
    const created = database.prepare(`
      SELECT id, internship_id, created_at
      FROM applications
      WHERE id = ?
    `).get(result.lastInsertRowid);

    response.status(201).json({
      status: 'success',
      data: created,
      pagination: null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createApplication };
