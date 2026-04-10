CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL DEFAULT 'Без названия',
  genre TEXT NOT NULL DEFAULT '',
  words INTEGER NOT NULL DEFAULT 0,
  manuscript TEXT NOT NULL DEFAULT '',
  synopsis TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);