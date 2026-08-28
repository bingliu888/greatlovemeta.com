ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1 CHECK(email_verified IN (0,1));

UPDATE users SET email_verified=0 WHERE lower(email) LIKE '%@unverified.invalid';
