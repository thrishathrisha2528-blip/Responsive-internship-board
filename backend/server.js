const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`InternHub API listening on http://localhost:${port}`);
});

server.on('error', error => {
  console.error(`Unable to start InternHub API (${error.code || error.name})`);
  process.exitCode = 1;
});
