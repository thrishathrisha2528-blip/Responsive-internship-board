CREATE TABLE IF NOT EXISTS internships (
  id TEXT PRIMARY KEY NOT NULL
    CHECK (length(trim(id)) BETWEEN 1 AND 50),
  title TEXT NOT NULL
    CHECK (length(trim(title)) BETWEEN 1 AND 200),
  domain TEXT NOT NULL
    CHECK (length(trim(domain)) BETWEEN 1 AND 100),
  mode TEXT NOT NULL
    CHECK (mode IN ('Remote', 'Hybrid', 'On-site')),
  location TEXT
    CHECK (location IS NULL OR length(location) <= 150),
  skills TEXT NOT NULL
    CHECK (json_valid(skills) AND json_type(skills) = 'array'),
  openings INTEGER NOT NULL
    CHECK (typeof(openings) = 'integer' AND openings > 0),
  duration_weeks INTEGER
    CHECK (duration_weeks IS NULL OR (typeof(duration_weeks) = 'integer' AND duration_weeks > 0)),
  applications_open INTEGER NOT NULL DEFAULT 1
    CHECK (applications_open IN (0, 1))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  internship_id TEXT NOT NULL
    REFERENCES internships(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL
    CHECK (length(trim(applicant_name)) BETWEEN 2 AND 100),
  applicant_email TEXT COLLATE NOCASE NOT NULL
    CHECK (length(applicant_email) BETWEEN 3 AND 254),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (internship_id, applicant_email)
);

CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain);
CREATE INDEX IF NOT EXISTS idx_internships_mode ON internships(mode);
CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON applications(internship_id);
