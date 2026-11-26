const { createHttpError } = require('./errorHandler');

const allowedModes = new Set(['Remote', 'Hybrid', 'On-site']);
const internshipFields = new Set([
  'id',
  'title',
  'domain',
  'mode',
  'location',
  'skills',
  'openings',
  'duration_weeks',
  'applications_open'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectUnknownFields(body, allowedFields) {
  if (Object.keys(body).some(field => !allowedFields.has(field))) {
    throw createHttpError(400, 'Request contains unsupported fields');
  }
}

function validateText(value, field, maxLength, { optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === '')) {
    return null;
  }
  if (typeof value !== 'string') {
    throw createHttpError(400, `${field} must be a string`);
  }

  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw createHttpError(400, `${field} is required and must be at most ${maxLength} characters`);
  }
  return text;
}

function validatePositiveInteger(value, field, { optional = false } = {}) {
  if (optional && (value === undefined || value === null)) {
    return null;
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw createHttpError(400, `${field} must be a positive integer`);
  }
  return value;
}

function validateInternshipRequest({ requireId = false } = {}) {
  return (request, response, next) => {
    try {
      const body = request.body;
      if (!isObject(body)) {
        throw createHttpError(400, 'Request body must be a JSON object');
      }
      rejectUnknownFields(body, internshipFields);

      const id = requireId
        ? validateText(body.id, 'id', 50)
        : request.params.id;
      if (!requireId && body.id !== undefined && body.id !== id) {
        throw createHttpError(400, 'id cannot differ from the URL id');
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(id)) {
        throw createHttpError(400, 'id contains unsupported characters');
      }

      if (typeof body.mode !== 'string' || !allowedModes.has(body.mode)) {
        throw createHttpError(400, 'mode must be Remote, Hybrid, or On-site');
      }
      if (!Array.isArray(body.skills) || body.skills.length > 50) {
        throw createHttpError(400, 'skills must be an array of up to 50 strings');
      }
      const skills = body.skills.map(skill => validateText(skill, 'each skill', 80));

      let applicationsOpen = 1;
      if (body.applications_open !== undefined) {
        if (body.applications_open === true || body.applications_open === 1) {
          applicationsOpen = 1;
        } else if (body.applications_open === false || body.applications_open === 0) {
          applicationsOpen = 0;
        } else {
          throw createHttpError(400, 'applications_open must be a boolean or 0/1');
        }
      }

      request.validatedInternship = {
        id,
        title: validateText(body.title, 'title', 200),
        domain: validateText(body.domain, 'domain', 100),
        mode: body.mode,
        location: validateText(body.location, 'location', 150, { optional: true }),
        skills,
        openings: validatePositiveInteger(body.openings, 'openings'),
        duration_weeks: validatePositiveInteger(body.duration_weeks, 'duration_weeks', { optional: true }),
        applications_open: applicationsOpen,
        applicationsOpenProvided: body.applications_open !== undefined
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

function parsePositiveQueryInteger(value, field, fallback, maximum) {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw createHttpError(400, `${field} must be a positive integer`);
  }

  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > maximum) {
    throw createHttpError(400, `${field} must not exceed ${maximum}`);
  }
  return number;
}

function validateInternshipQuery(request, response, next) {
  try {
    const { page: rawPage, limit: rawLimit, search, domain, mode } = request.query;
    request.validatedQuery = {
      page: parsePositiveQueryInteger(rawPage, 'page', 1, 1000000),
      limit: parsePositiveQueryInteger(rawLimit, 'limit', 5, 100),
      search: search === undefined ? '' : validateText(search, 'search', 200, { optional: true }) || '',
      domain: domain === undefined ? '' : validateText(domain, 'domain', 100, { optional: true }) || '',
      mode: mode === undefined ? '' : validateText(mode, 'mode', 20, { optional: true }) || ''
    };
    if (request.validatedQuery.mode && !allowedModes.has(request.validatedQuery.mode)) {
      throw createHttpError(400, 'mode must be Remote, Hybrid, or On-site');
    }
    next();
  } catch (error) {
    next(error);
  }
}

function validateApplicationRequest(request, response, next) {
  try {
    const body = request.body;
    if (!isObject(body)) {
      throw createHttpError(400, 'Request body must be a JSON object');
    }
    const allowedFields = new Set(['internship_id', 'applicant_name', 'applicant_email']);
    rejectUnknownFields(body, allowedFields);

    const applicantName = validateText(body.applicant_name, 'applicant_name', 100);
    if (applicantName.length < 2) {
      throw createHttpError(400, 'applicant_name must contain at least 2 characters');
    }
    const applicantEmail = validateText(body.applicant_email, 'applicant_email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
      throw createHttpError(400, 'applicant_email must be a valid email address');
    }

    request.validatedApplication = {
      internship_id: validateText(body.internship_id, 'internship_id', 50),
      applicant_name: applicantName,
      applicant_email: applicantEmail
    };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateApplicationRequest,
  validateInternshipQuery,
  validateInternshipRequest
};
