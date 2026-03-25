-- Add password reset functionality to users table

ALTER TABLE users 
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expires TIMESTAMP;

CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
