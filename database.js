const sqlite3 = require("sqlite3").verbose()
const path = require("path")

const dbPath = path.join(__dirname, "lede_character.db")
const db = new sqlite3.Database(dbPath)

// Initialize tables once when module loads
db.serialize(() => {
  // Existing tables
  db.run(`
    CREATE TABLE IF NOT EXISTS analysis_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      total_articles INTEGER,
      accepted_articles INTEGER
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

  // Clean narratives table
  db.run(`
    CREATE TABLE IF NOT EXISTS narratives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER UNIQUE,
      title TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (article_id) REFERENCES articles (id)
    )
  `)

  // Clean story nodes - just content
  db.run(`
    CREATE TABLE IF NOT EXISTS story_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      narrative_id INTEGER,
      content TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (narrative_id) REFERENCES narratives (id)
    )
  `)

  // Clean choices - parent/child relationships
  db.run(`
    CREATE TABLE IF NOT EXISTS choices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      narrative_id INTEGER,
      parent_node_id INTEGER,
      child_node_id INTEGER,
      choice_text TEXT,
      choice_order INTEGER,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (narrative_id) REFERENCES narratives (id),
      FOREIGN KEY (parent_node_id) REFERENCES story_nodes (id),
      FOREIGN KEY (child_node_id) REFERENCES story_nodes (id)
    )
  `)

  // User sessions for tracking playback
  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      narrative_id INTEGER,
      current_node_id INTEGER,
      path_taken TEXT, -- JSON array of node IDs
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      completed_at TEXT,
      FOREIGN KEY (narrative_id) REFERENCES narratives (id),
      FOREIGN KEY (current_node_id) REFERENCES story_nodes (id)
    )
  `)
})

function saveAnalysisRun(totalArticles, acceptedArticles) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert analysis run
      db.run(
        "INSERT INTO analysis_runs (total_articles, accepted_articles) VALUES (?, ?)",
        [totalArticles, acceptedArticles.length],
        function (err) {
          if (err) {
            reject(err)
            return
          }

          const runId = this.lastID

          // Insert accepted articles
          const stmt = db.prepare(`
            INSERT INTO articles (run_id, title, description, url, author, published_at, source) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)

          acceptedArticles.forEach((article) => {
            stmt.run([
              runId,
              article.title,
              article.description,
              article.url,
              article.author,
              article.publishedAt,
              article.source?.name,
            ])
          })

          stmt.finalize((err) => {
            if (err) {
              reject(err)
            } else {
              resolve(runId)
            }
          })
        }
      )
    })
  })
}

module.exports = { db, saveAnalysisRun }
