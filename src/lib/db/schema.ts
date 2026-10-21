/**
 * PostgreSQL schema for English Journey Academy.
 *
 * The schema is embedded as a TypeScript string so it ships with the CLI
 * scripts and works on any PostgreSQL host (Neon, Supabase, Railway, ...).
 * Every statement is idempotent (`IF NOT EXISTS`), so `npm run db:setup` can
 * be re-run safely.
 *
 * Timestamps are stored as ISO-8601 TEXT on purpose: the application compares
 * them lexicographically (`expires_at < now`) and the existing row mappers
 * expect strings, which also keeps the migration from SQLite mechanical.
 */
export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ADMIN')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id            TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 15,
  theme              TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  ui_language        TEXT NOT NULL DEFAULT 'ar' CHECK (ui_language IN ('ar', 'en')),
  updated_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id                  TEXT PRIMARY KEY,
  provider            TEXT NOT NULL CHECK (provider IN ('YOUTUBE', 'VIMEO', 'AUDIO_FILE', 'VIDEO_FILE', 'NONE')),
  external_id         TEXT,
  url                 TEXT,
  title               TEXT,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
                        CHECK (verification_status IN ('UNVERIFIED', 'AVAILABLE', 'UNAVAILABLE', 'NEEDS_REVIEW')),
  verification_note   TEXT,
  source_url          TEXT,
  last_checked_at     TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  title_ar     TEXT,
  description  TEXT NOT NULL DEFAULT '',
  level        TEXT NOT NULL DEFAULT 'a1' CHECK (level IN ('foundation', 'a1', 'a2', 'b1', 'b2', 'c1')),
  level_group  INTEGER NOT NULL DEFAULT 1,
  category     TEXT NOT NULL DEFAULT 'general',
  cover_emoji  TEXT NOT NULL DEFAULT '📘',
  accent       TEXT NOT NULL DEFAULT 'indigo',
  playlist_id  TEXT,
  is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_courses_playlist ON courses(playlist_id);
CREATE INDEX IF NOT EXISTS idx_courses_position ON courses(position, title);

CREATE TABLE IF NOT EXISTS youtube_cache (
  playlist_id TEXT PRIMARY KEY,
  items       TEXT NOT NULL,
  fetched_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id               TEXT PRIMARY KEY,
  course_id        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  title_ar         TEXT,
  summary          TEXT NOT NULL DEFAULT '',
  content          TEXT NOT NULL DEFAULT '',
  transcript       TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  position         INTEGER NOT NULL DEFAULT 0,
  media_id         TEXT REFERENCES media(id) ON DELETE SET NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  UNIQUE (course_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, position);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id        TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'NOT_STARTED'
                     CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  position_seconds INTEGER NOT NULL DEFAULT 0,
  percent          INTEGER NOT NULL DEFAULT 0,
  updated_at       TEXT NOT NULL,
  completed_at     TEXT,
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id);

CREATE TABLE IF NOT EXISTS vocabulary (
  id             TEXT PRIMARY KEY,
  course_id      TEXT REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id      TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  term           TEXT NOT NULL,
  translation    TEXT NOT NULL,
  part_of_speech TEXT NOT NULL DEFAULT 'noun',
  phonetic       TEXT,
  example        TEXT NOT NULL DEFAULT '',
  created_by     TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vocabulary_course ON vocabulary(course_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_owner ON vocabulary(created_by);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson ON vocabulary(lesson_id);

-- The shared word bank must contain each English term only once. Learner-owned
-- words are still free to repeat a shared term, hence the partial index.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_shared_term
  ON vocabulary (lower(term)) WHERE created_by IS NULL;

-- Many-to-many link between lessons and the shared word bank.
CREATE TABLE IF NOT EXISTS lesson_vocabulary (
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  vocab_id  TEXT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lesson_id, vocab_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary ON lesson_vocabulary(lesson_id, position);

CREATE TABLE IF NOT EXISTS vocab_review (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id         TEXT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  ease             DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  interval_days    INTEGER NOT NULL DEFAULT 0,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  lapses           INTEGER NOT NULL DEFAULT 0,
  due_at           TEXT NOT NULL,
  last_reviewed_at TEXT,
  UNIQUE (user_id, vocab_id)
);
CREATE INDEX IF NOT EXISTS idx_review_due ON vocab_review(user_id, due_at);

CREATE TABLE IF NOT EXISTS stories (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  title_ar     TEXT,
  level        TEXT NOT NULL DEFAULT 'a1' CHECK (level IN ('foundation', 'a1', 'a2', 'b1', 'b2', 'c1')),
  cover_emoji  TEXT NOT NULL DEFAULT '📖',
  summary      TEXT NOT NULL DEFAULT '',
  body         TEXT NOT NULL DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS story_questions (
  id           TEXT PRIMARY KEY,
  story_id     TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  prompt       TEXT NOT NULL,
  options      TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation  TEXT NOT NULL DEFAULT '',
  position     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questions_story ON story_questions(story_id, position);

CREATE TABLE IF NOT EXISTS story_attempts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id   TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  answers    TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON story_attempts(user_id, story_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  actor_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  detail     TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS vocab_favorites (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id   TEXT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, vocab_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON vocab_favorites(user_id, created_at);

CREATE TABLE IF NOT EXISTS quizzes (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  title_ar     TEXT,
  description  TEXT NOT NULL DEFAULT '',
  level        TEXT NOT NULL DEFAULT 'a1' CHECK (level IN ('foundation', 'a1', 'a2', 'b1', 'b2', 'c1')),
  course_id    TEXT REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id    TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id               TEXT PRIMARY KEY,
  quiz_id          TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type             TEXT NOT NULL DEFAULT 'MULTIPLE_CHOICE'
                     CHECK (type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK')),
  prompt           TEXT NOT NULL,
  options          TEXT NOT NULL DEFAULT '[]',
  answer_index     INTEGER,
  accepted_answers TEXT NOT NULL DEFAULT '[]',
  correct_boolean  INTEGER,
  points           INTEGER NOT NULL DEFAULT 1,
  explanation      TEXT NOT NULL DEFAULT '',
  position         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quiz_questions ON quiz_questions(quiz_id, position);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id         TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score_points    INTEGER NOT NULL DEFAULT 0,
  max_points      INTEGER NOT NULL DEFAULT 0,
  correct_count   INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answers         TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, quiz_id);

CREATE TABLE IF NOT EXISTS points_ledger (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source     TEXT NOT NULL CHECK (source IN ('LESSON', 'QUIZ', 'STORY', 'REVIEW')),
  source_id  TEXT,
  points     INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_points_user ON points_ledger(user_id, created_at);
`;
