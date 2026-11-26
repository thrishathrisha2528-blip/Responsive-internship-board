const database = require('../database/connection');
const { createHttpError } = require('../middleware/errorHandler');

function toInternship(row) {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain,
    mode: row.mode,
    location: row.location,
    skills: JSON.parse(row.skills),
    openings: row.openings,
    duration_weeks: row.duration_weeks,
    applications_open: Boolean(row.applications_open)
  };
}

function listInternships(request, response, next) {
  try {
    const { page, limit, search, domain, mode } = request.validatedQuery;
    const conditions = [];
    const parameters = [];

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      conditions.push(`(
        lower(title) LIKE ? OR
        lower(domain) LIKE ? OR
        lower(mode) LIKE ? OR
        lower(coalesce(location, '')) LIKE ? OR
        lower(skills) LIKE ?
      )`);
      parameters.push(term, term, term, term, term);
    }
    if (domain) {
      conditions.push('lower(domain) = lower(?)');
      parameters.push(domain);
    }
    if (mode) {
      conditions.push('mode = ?');
      parameters.push(mode);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const totalRecords = database.prepare(
      `SELECT COUNT(*) AS count FROM internships ${where}`
    ).get(...parameters).count;
    const rows = database.prepare(`
      SELECT id, title, domain, mode, location, skills, openings, duration_weeks, applications_open
      FROM internships
      ${where}
      ORDER BY id
      LIMIT ? OFFSET ?
    `).all(...parameters, limit, (page - 1) * limit);

    response.json({
      status: 'success',
      data: rows.map(toInternship),
      pagination: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages: Math.max(1, Math.ceil(totalRecords / limit))
      }
    });
  } catch (error) {
    next(error);
  }
}

function getInternship(request, response, next) {
  try {
    const row = database.prepare(`
      SELECT id, title, domain, mode, location, skills, openings, duration_weeks, applications_open
      FROM internships
      WHERE id = ?
    `).get(request.params.id);
    if (!row) {
      throw createHttpError(404, 'Internship not found');
    }
    response.json({ status: 'success', data: toInternship(row), pagination: null });
  } catch (error) {
    next(error);
  }
}

function createInternship(request, response, next) {
  try {
    const internship = request.validatedInternship;
    const existing = database.prepare('SELECT id FROM internships WHERE id = ?').get(internship.id);
    if (existing) {
      throw createHttpError(409, 'Internship ID already exists');
    }

    database.prepare(`
      INSERT INTO internships
        (id, title, domain, mode, location, skills, openings, duration_weeks, applications_open)
      VALUES
        (@id, @title, @domain, @mode, @location, @skills, @openings, @duration_weeks, @applications_open)
    `).run({
      ...internship,
      skills: JSON.stringify(internship.skills)
    });

    const row = database.prepare(`
      SELECT id, title, domain, mode, location, skills, openings, duration_weeks, applications_open
      FROM internships WHERE id = ?
    `).get(internship.id);
    response.status(201).json({ status: 'success', data: toInternship(row), pagination: null });
  } catch (error) {
    next(error);
  }
}

function updateInternship(request, response, next) {
  try {
    const internship = request.validatedInternship;
    const existing = database.prepare('SELECT * FROM internships WHERE id = ?').get(request.params.id);
    if (!existing) {
      throw createHttpError(404, 'Internship not found');
    }

    database.prepare(`
      UPDATE internships
      SET title = @title,
          domain = @domain,
          mode = @mode,
          location = @location,
          skills = @skills,
          openings = @openings,
          duration_weeks = @duration_weeks,
          applications_open = @applications_open
      WHERE id = @id
    `).run({
      ...internship,
      applications_open: internship.applicationsOpenProvided
        ? internship.applications_open
        : existing.applications_open,
      skills: JSON.stringify(internship.skills)
    });

    const updated = database.prepare(`
      SELECT id, title, domain, mode, location, skills, openings, duration_weeks, applications_open
      FROM internships WHERE id = ?
    `).get(request.params.id);
    response.json({ status: 'success', data: toInternship(updated), pagination: null });
  } catch (error) {
    next(error);
  }
}

function deleteInternship(request, response, next) {
  try {
    const result = database.prepare('DELETE FROM internships WHERE id = ?').run(request.params.id);
    if (!result.changes) {
      throw createHttpError(404, 'Internship not found');
    }
    response.json({
      status: 'success',
      data: { id: request.params.id },
      pagination: null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInternship,
  deleteInternship,
  getInternship,
  listInternships,
  updateInternship
};
