ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;
ALTER TABLE users ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE users ADD COLUMN approved_by_email TEXT;
ALTER TABLE users ADD COLUMN approved_at TEXT;
ALTER TABLE users ADD COLUMN requested_at TEXT;
ALTER TABLE users ADD COLUMN google_access_scope TEXT;
ALTER TABLE users ADD COLUMN google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN google_access_granted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_requested_at ON users(requested_at);
