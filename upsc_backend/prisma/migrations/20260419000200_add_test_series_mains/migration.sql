-- Schema defined TestSeriesMainsQuestion/Attempt/Evaluation but tables were
-- missing from the database, so every mains submission from the Test Series
-- surface failed. Create them with FK types matching the referenced tables
-- (test_series.id = uuid, users.id = text).

CREATE TABLE IF NOT EXISTS test_series_mains_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  subject TEXT NOT NULL,
  paper TEXT NOT NULL DEFAULT 'GS-I',
  marks INTEGER NOT NULL DEFAULT 15,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT test_series_mains_questions_series_id_fkey
    FOREIGN KEY (series_id) REFERENCES test_series(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS test_series_mains_questions_series_id_order_idx
  ON test_series_mains_questions(series_id, "order");

CREATE TABLE IF NOT EXISTS test_series_mains_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  series_id UUID NOT NULL,
  question_id UUID NOT NULL,
  answer_text TEXT,
  file_url TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT test_series_mains_attempts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT test_series_mains_attempts_series_id_fkey
    FOREIGN KEY (series_id) REFERENCES test_series(id) ON DELETE CASCADE,
  CONSTRAINT test_series_mains_attempts_question_id_fkey
    FOREIGN KEY (question_id) REFERENCES test_series_mains_questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS test_series_mains_attempts_user_id_series_id_idx
  ON test_series_mains_attempts(user_id, series_id);

CREATE TABLE IF NOT EXISTS test_series_mains_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE,
  score DOUBLE PRECISION NOT NULL,
  max_score DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  strengths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  improvements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  suggestions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  detailed_feedback TEXT,
  evaluated_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT test_series_mains_evaluations_attempt_id_fkey
    FOREIGN KEY (attempt_id) REFERENCES test_series_mains_attempts(id) ON DELETE CASCADE
);
