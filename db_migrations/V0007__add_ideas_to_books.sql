ALTER TABLE books
  ADD COLUMN ideas_tags text NOT NULL DEFAULT '',
  ADD COLUMN ideas_notes text NOT NULL DEFAULT '';