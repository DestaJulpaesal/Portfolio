CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  summary text NOT NULL,
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  stack text[] NOT NULL DEFAULT '{}',
  href text,
  repo text,
  status text NOT NULL DEFAULT 'source-only'
    CHECK (status IN ('live', 'source-only', 'in-progress', 'archived')),
  image text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  issuer text NOT NULL,
  date text NOT NULL,
  url text,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE messages ALTER COLUMN email DROP NOT NULL;
ALTER TABLE messages DROP COLUMN IF EXISTS subject;

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_content (
  section text PRIMARY KEY CHECK (section IN ('profile', 'about', 'skills')),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_sort_order_idx ON projects (sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS certifications_sort_order_idx ON certifications (sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS messages_unread_idx ON messages (is_read) WHERE is_read = false;
