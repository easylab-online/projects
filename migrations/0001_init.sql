-- EasyLab Projects — initial schema (matches existing remote D1)
-- Password: stored as PBKDF2-SHA256 (100000 iter, 32-byte key); salt/hash hex strings in DB.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  image_url TEXT,
  github_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Seed admin user (hash/salt only — no plaintext password in this file)
INSERT OR IGNORE INTO users (email, password_hash, password_salt)
VALUES (
  'wajih.awad90@gmail.com',
  'aaa1f96ff5753da28c8aec7b2d23631d177c815f7002999f42017cda4dacb443',
  '109a1951b88e428881b832d97dedc5ba'
);

INSERT OR IGNORE INTO projects (id, name, description, icon, github_url, sort_order) VALUES
  ('doneplan', 'DonePlan', 'تطبيق إدارة المهام والمشاريع لفرق العمل — لوحات كانبان، تذكيرات، ومزامنة سحابية.', '📋', 'https://github.com/easylab-online/doneplan', 1),
  ('kishha', 'Kishha', 'لعبة شطرنج عربية مع لوحات حية، وضع عدم الاتصال، ولوحة تحكم للإدارة.', '♟️', 'https://github.com/easylab-online/kishha', 2),
  ('easylab-hub', 'EasyLab Hub', 'بوابة داخلية لخدمات EasyLab: أدوات، روابط سريعة، ومراقبة حالة المشاريع.', '🧪', 'https://github.com/easylab-online/hub', 3);

INSERT OR IGNORE INTO project_links (id, project_id, label, url, sort_order) VALUES
  (1, 'doneplan', 'الموقع', 'https://doneplan.easylab.online', 1),
  (2, 'doneplan', 'التوثيق', 'https://docs.easylab.online/doneplan', 2),
  (3, 'kishha', 'اللعب الآن', 'https://kishha.easylab.online', 1),
  (4, 'kishha', 'لوحة الإدارة', 'https://admin.kishha.easylab.online', 2),
  (5, 'easylab-hub', 'البوابة', 'https://easylab.online', 1),
  (6, 'easylab-hub', 'الحالة', 'https://status.easylab.online', 2);
