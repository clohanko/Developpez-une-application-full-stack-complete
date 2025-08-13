INSERT IGNORE INTO users (username, email, password) VALUES (
  'sebastien',
  'sebastien@mail.com',
  '$2a$10$bdLrOti62N0q3m7Qk4HyE.nvEx0mrM2L5uEhNYOrqPZTtvQtqsoLK'
);

INSERT IGNORE INTO topics (name, slug, description, created_at) VALUES
('Java',    'java',    'Tout sur Java',           NOW()),
('Spring',  'spring',  'Spring & Spring Boot',    NOW()),
('Angular', 'angular', 'Angular & RxJS',          NOW()),
('SQL',     'sql',     'Bases de données & SQL',  NOW());