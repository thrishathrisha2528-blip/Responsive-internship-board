const database = require('./connection');

const seedInternships = (db = database) => {
  const insertInternship = db.prepare(`
    INSERT OR IGNORE INTO internships
      (id, title, domain, mode, location, skills, openings)
    VALUES
      (@id, @title, @domain, @mode, @location, @skills, @openings)
  `);

  const records = [
    {
      id: 'INT-101',
      title: 'Frontend Intern',
      domain: 'Full Stack Development',
      mode: 'Remote',
      location: 'India',
      skills: ['HTML', 'CSS', 'JavaScript'],
      openings: 3
    },
    {
      id: 'INT-102',
      title: 'API Engineering Intern',
      domain: 'Full Stack Development',
      mode: 'Hybrid',
      location: 'Pune',
      skills: ['Node.js', 'SQL', 'Testing'],
      openings: 2
    },
    {
      id: 'INT-103',
      title: 'UI/UX Intern',
      domain: 'UI/UX',
      mode: 'Remote',
      location: 'India',
      skills: ['Figma', 'Research', 'Accessibility'],
      openings: 1
    },
    {
      id: 'INT-104',
      title: 'Data Analyst Intern',
      domain: 'Data Analytics',
      mode: 'On-site',
      location: 'Bengaluru',
      skills: ['Excel', 'SQL', 'Data visualisation'],
      openings: 2
    },
    {
      id: 'INT-105',
      title: 'Security Operations Intern',
      domain: 'Cyber Security',
      mode: 'Remote',
      location: 'India',
      skills: ['Linux', 'Logs', 'Networking'],
      openings: 1
    }
  ];

  const insertAll = db.transaction(() => {
    let inserted = 0;
    for (const record of records) {
      const result = insertInternship.run({
        ...record,
        skills: JSON.stringify(record.skills)
      });
      inserted += result.changes;
    }
    return inserted;
  });

  return insertAll();
};

if (require.main === module) {
  const inserted = seedInternships();
  const total = database.prepare('SELECT COUNT(*) AS count FROM internships').get().count;
  console.log(`Seed complete: ${inserted} inserted, ${total} internship records present.`);
  database.close();
}

module.exports = { seedInternships };
