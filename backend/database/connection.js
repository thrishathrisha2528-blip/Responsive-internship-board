const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const backendDirectory = path.resolve(__dirname, '..');
const configuredPath = process.env.DATABASE_PATH;
const databasePath = configuredPath
  ? path.resolve(backendDirectory, configuredPath)
  : path.join(__dirname, 'internships.sqlite');

if (databasePath !== ':memory:') {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

const database = new Database(databasePath);
database.pragma('foreign_keys = ON');
database.pragma('busy_timeout = 5000');
database.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

module.exports = database;
