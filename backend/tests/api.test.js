const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, beforeEach, test } = require('node:test');
const Database = require('better-sqlite3');
const request = require('supertest');

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'internhub-api-test-'));
const databasePath = path.join(temporaryDirectory, 'test.sqlite');
process.env.DATABASE_PATH = databasePath;
process.env.NODE_ENV = 'test';

const app = require('../app');
const database = require('../database/connection');
const { seedInternships } = require('../database/seed');

before(() => {
  seedInternships(database);
});

beforeEach(() => {
  database.exec('DELETE FROM applications; DELETE FROM internships;');
  seedInternships(database);
});

after(() => {
  if (database.open) {
    database.close();
  }
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

function newInternship(overrides = {}) {
  return {
    id: 'INT-106',
    title: 'Platform Intern',
    domain: 'Full Stack Development',
    mode: 'Remote',
    location: 'India',
    skills: ['Node.js', 'SQLite'],
    openings: 2,
    ...overrides
  };
}

test('GET /api/internships lists seeded records with pagination metadata', async () => {
  const response = await request(app).get('/api/internships').expect(200);
  assert.equal(response.body.status, 'success');
  assert.equal(response.body.data.length, 5);
  assert.deepEqual(response.body.data.map(record => record.id), [
    'INT-101', 'INT-102', 'INT-103', 'INT-104', 'INT-105'
  ]);
  assert.deepEqual(response.body.pagination, {
    currentPage: 1,
    limit: 5,
    totalRecords: 5,
    totalPages: 1
  });
  assert.deepEqual(response.body.data[0].skills, ['HTML', 'CSS', 'JavaScript']);
  assert.equal(response.body.data[0].duration_weeks, null);
});

test('list endpoint paginates and combines search, domain, and mode filters', async () => {
  const page = await request(app).get('/api/internships?page=2&limit=2').expect(200);
  assert.equal(page.body.data.length, 2);
  assert.deepEqual(page.body.pagination, {
    currentPage: 2,
    limit: 2,
    totalRecords: 5,
    totalPages: 3
  });

  const filtered = await request(app)
    .get('/api/internships?search=node.js&domain=Full%20Stack%20Development&mode=Hybrid')
    .expect(200);
  assert.deepEqual(filtered.body.data.map(record => record.id), ['INT-102']);
  assert.equal(filtered.body.pagination.totalRecords, 1);
});

test('list endpoint rejects invalid pagination and filter values', async () => {
  const invalidPage = await request(app).get('/api/internships?page=0').expect(400);
  assert.equal(invalidPage.body.status, 'error');
  const invalidMode = await request(app).get('/api/internships?mode=Anywhere').expect(400);
  assert.equal(invalidMode.body.status, 'error');
});

test('GET /api/internships/:id returns a record or a consistent 404', async () => {
  const found = await request(app).get('/api/internships/INT-103').expect(200);
  assert.equal(found.body.data.title, 'UI/UX Intern');
  assert.deepEqual(found.body.data.skills, ['Figma', 'Research', 'Accessibility']);

  const missing = await request(app).get('/api/internships/INT-999').expect(404);
  assert.deepEqual(missing.body, { status: 'error', message: 'Internship not found' });
});

test('POST /api/internships creates records and rejects invalid or duplicate input', async () => {
  const created = await request(app)
    .post('/api/internships')
    .send(newInternship({ duration_weeks: 12, applications_open: false }))
    .expect(201);
  assert.equal(created.body.data.id, 'INT-106');
  assert.equal(created.body.data.duration_weeks, 12);
  assert.equal(created.body.data.applications_open, false);

  const duplicate = await request(app)
    .post('/api/internships')
    .send(newInternship())
    .expect(409);
  assert.match(duplicate.body.message, /already exists/i);

  const invalid = await request(app)
    .post('/api/internships')
    .send(newInternship({ openings: 0 }))
    .expect(400);
  assert.match(invalid.body.message, /openings/i);

  const missing = await request(app)
    .post('/api/internships')
    .send({ id: 'INT-107', title: 'Incomplete' })
    .expect(400);
  assert.equal(missing.body.status, 'error');
});

test('PUT /api/internships/:id updates a record and reports missing records', async () => {
  const updated = await request(app)
    .put('/api/internships/INT-101')
    .send(newInternship({
      id: 'INT-101',
      title: 'Updated Frontend Intern',
      domain: 'Full Stack Development',
      mode: 'Hybrid',
      skills: ['HTML', 'CSS', 'TypeScript'],
      openings: 4
    }))
    .expect(200);
  assert.equal(updated.body.data.title, 'Updated Frontend Intern');
  assert.equal(updated.body.data.mode, 'Hybrid');
  assert.equal(updated.body.data.applications_open, true);

  const invalid = await request(app)
    .put('/api/internships/INT-101')
    .send(newInternship({ id: 'INT-101', mode: 'Anywhere' }))
    .expect(400);
  assert.equal(invalid.body.status, 'error');

  const missing = await request(app)
    .put('/api/internships/INT-999')
    .send(newInternship({ id: 'INT-999' }))
    .expect(404);
  assert.equal(missing.body.message, 'Internship not found');
});

test('DELETE /api/internships/:id removes the record and cascades applications', async () => {
  await request(app)
    .post('/api/applications')
    .send({
      internship_id: 'INT-101',
      applicant_name: 'Taylor Applicant',
      applicant_email: 'taylor@example.com'
    })
    .expect(201);

  const deleted = await request(app).delete('/api/internships/INT-101').expect(200);
  assert.deepEqual(deleted.body.data, { id: 'INT-101' });
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM applications').get().count, 0);

  const missing = await request(app).delete('/api/internships/INT-101').expect(404);
  assert.equal(missing.body.message, 'Internship not found');
});

test('POST /api/applications validates, stores, and prevents duplicate applications', async () => {
  const payload = {
    internship_id: 'INT-101',
    applicant_name: 'Taylor Applicant',
    applicant_email: 'Taylor@example.com'
  };
  const created = await request(app).post('/api/applications').send(payload).expect(201);
  assert.equal(created.body.status, 'success');
  assert.equal(created.body.data.internship_id, 'INT-101');
  assert.ok(created.body.data.created_at);
  assert.equal(Object.hasOwn(created.body.data, 'applicant_email'), false);

  const duplicate = await request(app)
    .post('/api/applications')
    .send({ ...payload, applicant_email: 'taylor@example.com' })
    .expect(409);
  assert.match(duplicate.body.message, /already exists/i);

  const invalidEmail = await request(app)
    .post('/api/applications')
    .send({ ...payload, internship_id: 'INT-102', applicant_email: 'invalid' })
    .expect(400);
  assert.equal(invalidEmail.body.status, 'error');

  const invalidName = await request(app)
    .post('/api/applications')
    .send({ ...payload, internship_id: 'INT-102', applicant_name: ' ' })
    .expect(400);
  assert.equal(invalidName.body.status, 'error');
});

test('applications reject missing internships and closed listings', async () => {
  const missing = await request(app)
    .post('/api/applications')
    .send({
      internship_id: 'INT-999',
      applicant_name: 'Taylor Applicant',
      applicant_email: 'taylor@example.com'
    })
    .expect(404);
  assert.equal(missing.body.message, 'Internship not found');

  database.prepare('UPDATE internships SET applications_open = 0 WHERE id = ?').run('INT-101');
  const closed = await request(app)
    .post('/api/applications')
    .send({
      internship_id: 'INT-101',
      applicant_name: 'Taylor Applicant',
      applicant_email: 'taylor@example.com'
    })
    .expect(409);
  assert.match(closed.body.message, /closed/i);
});

test('seed command is idempotent and records persist after reopening SQLite', () => {
  assert.equal(seedInternships(database), 0);
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM internships').get().count, 5);
  database.close();

  const reopened = new Database(databasePath);
  reopened.pragma('foreign_keys = ON');
  assert.equal(reopened.prepare('SELECT COUNT(*) AS count FROM internships').get().count, 5);
  assert.equal(reopened.prepare('SELECT title FROM internships WHERE id = ?').get('INT-101').title, 'Frontend Intern');
  reopened.close();
});
