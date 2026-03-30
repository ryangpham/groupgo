ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

UPDATE users
SET password_hash = '$2b$12$9Uvl6JMD7lyNCqkxqE2MC.I7sSvD83ljlZ2eUXyJkhQDyiHLnFJcG'
WHERE password_hash IS NULL;

ALTER TABLE users
ALTER COLUMN password_hash SET NOT NULL;

-- Seeded users will authenticate with: groupgo123
