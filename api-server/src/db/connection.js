const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const env = require("../config/env");

const dbDir = path.dirname(env.dbPath);
fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(env.dbPath);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA journal_mode = WAL");
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function transaction(callback) {
  await run("BEGIN");

  try {
    const result = await callback({ run, get, all });
    await run("COMMIT");
    return result;
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

module.exports = {
  db,
  run,
  get,
  all,
  transaction
};
