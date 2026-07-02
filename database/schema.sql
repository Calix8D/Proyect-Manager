-- ============================================================
-- PROYECTA - Schema para Supabase (PostgreSQL)
-- Pega este script en: Supabase → SQL Editor → New query
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        VARCHAR(20)   NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  avatar_url  TEXT,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE
);

-- ── PROJECTS ─────────────────────────────────────────────────
CREATE TABLE projects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  description TEXT,
  status      VARCHAR(20)   NOT NULL DEFAULT 'active'  CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled')),
  priority    VARCHAR(20)   NOT NULL DEFAULT 'medium'  CHECK (priority IN ('low', 'medium', 'high')),
  start_date  DATE,
  end_date    DATE,
  owner_id    INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── PROJECT MEMBERS ───────────────────────────────────────────
CREATE TABLE project_members (
  id          SERIAL PRIMARY KEY,
  project_id  INT           NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INT           NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role        VARCHAR(20)   NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member', 'viewer')),
  joined_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- ── TASKS ────────────────────────────────────────────────────
CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  project_id  INT           NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(200)  NOT NULL,
  description TEXT,
  status      VARCHAR(20)   NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority    VARCHAR(20)   NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date    DATE,
  created_by  INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── TASK ASSIGNMENTS ─────────────────────────────────────────
CREATE TABLE task_assignments (
  id          SERIAL PRIMARY KEY,
  task_id     INT           NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, user_id)
);

-- ── COMMENTS ─────────────────────────────────────────────────
CREATE TABLE comments (
  id          SERIAL PRIMARY KEY,
  task_id     INT           NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT          NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── ÍNDICES (mejoran velocidad de consultas frecuentes) ───────
CREATE INDEX idx_projects_owner       ON projects(owner_id);
CREATE INDEX idx_project_members_proj ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_tasks_project        ON tasks(project_id);
CREATE INDEX idx_tasks_status         ON tasks(status);
CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_comments_task        ON comments(task_id);

-- ── TRIGGER: actualiza updated_at en tasks automáticamente ────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── DATOS DE PRUEBA (opcional, puedes borrar esto) ────────────
-- Admin de prueba  →  password: Admin123!
INSERT INTO users (name, email, password, role) VALUES
  ('Admin', 'admin@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'admin');
