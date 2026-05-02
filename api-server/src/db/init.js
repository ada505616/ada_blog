const { get, run } = require("./connection");
const env = require("../config/env");
const { hashPassword } = require("../utils/password");
const { now } = require("../utils/datetime");

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS admin_user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      email TEXT,
      avatar_url TEXT,
      status INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS admin_session (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER NOT NULL,
      refresh_token TEXT NOT NULL UNIQUE,
      expired_at TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (admin_user_id) REFERENCES admin_user(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      sort INTEGER NOT NULL DEFAULT 0,
      status INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS article (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      summary TEXT,
      cover_image_url TEXT,
      author_id INTEGER NOT NULL,
      category_id INTEGER,
      content_type TEXT NOT NULL,
      content_json TEXT,
      content_html TEXT,
      content_text TEXT,
      status TEXT NOT NULL,
      is_top INTEGER NOT NULL DEFAULT 0,
      allow_comment INTEGER NOT NULL DEFAULT 1,
      view_count INTEGER NOT NULL DEFAULT 0,
      comment_count INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (author_id) REFERENCES admin_user(id),
      FOREIGN KEY (category_id) REFERENCES category(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS article_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(article_id, tag_id),
      FOREIGN KEY (article_id) REFERENCES article(id),
      FOREIGN KEY (tag_id) REFERENCES tag(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS comment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      parent_id INTEGER,
      reply_to_comment_id INTEGER,
      user_id INTEGER,
      nickname TEXT NOT NULL,
      email TEXT,
      website TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (article_id) REFERENCES article(id),
      FOREIGN KEY (parent_id) REFERENCES comment(id),
      FOREIGN KEY (reply_to_comment_id) REFERENCES comment(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS media_file (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      original_name TEXT,
      file_ext TEXT,
      mime_type TEXT,
      file_size INTEGER,
      storage_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_path TEXT,
      width INTEGER,
      height INTEGER,
      hash TEXT,
      uploader_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (uploader_id) REFERENCES admin_user(id)
    )
  `);

  await run("CREATE INDEX IF NOT EXISTS idx_article_status ON article(status)");
  await run("CREATE INDEX IF NOT EXISTS idx_article_category_id ON article(category_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_article_author_id ON article(author_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_article_deleted_at ON article(deleted_at)");
  await run("CREATE INDEX IF NOT EXISTS idx_article_tag_article_id ON article_tag(article_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_article_tag_tag_id ON article_tag(tag_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_comment_article_id ON comment(article_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_comment_status ON comment(status)");
  await run("CREATE INDEX IF NOT EXISTS idx_admin_session_admin_user_id ON admin_session(admin_user_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_admin_session_expired_at ON admin_session(expired_at)");

  const admin = await get("SELECT id FROM admin_user WHERE deleted_at IS NULL LIMIT 1");

  if (!admin) {
    env.assertConfigured("ADMIN_DEFAULT_USERNAME", env.defaultAdminUsername);
    env.assertConfigured("ADMIN_DEFAULT_PASSWORD", env.defaultAdminPassword);

    const timestamp = now();
    await run(
      `
        INSERT INTO admin_user (
          username,
          password_hash,
          nickname,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, 1, ?, ?)
      `,
      [
        env.defaultAdminUsername,
        await hashPassword(env.defaultAdminPassword),
        env.defaultAdminNickname,
        timestamp,
        timestamp
      ]
    );
  }
}

module.exports = {
  initializeDatabase
};
