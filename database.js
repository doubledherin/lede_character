const sqlite3 = require("sqlite3").verbose()
const path = require("path")

const dbPath = path.join(__dirname, "lede_character.db")
const db = new sqlite3.Database(dbPath)

// Initialize tables once when module loads
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS analysis_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      total_articles INTEGER,
      accepted_articles INTEGER
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS narratives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      narrative_text TEXT,
      FOREIGN KEY (article_id) REFERENCES articles (id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER,
      title TEXT,
      description TEXT,
      url TEXT,
      author TEXT,
      published_at TEXT,
      source TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (run_id) REFERENCES analysis_runs (id)
    )
  `)
})

// Export the database connection
module.exports = { db }
