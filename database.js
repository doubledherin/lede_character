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

function saveAnalysisRun(totalArticles, acceptedArticles) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert analysis run
      db.run(
        "INSERT INTO analysis_runs (total_articles, accepted_articles, created_at) VALUES (?, ?, ?)",
        [totalArticles, acceptedArticles.length, new Date().toISOString()],
        function (err) {
          if (err) {
            reject(err)
            return
          }

          const runId = this.lastID

          // Insert accepted articles
          const stmt = db.prepare(`
            INSERT INTO articles (run_id, title, description, url, author, published_at, source, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
              new Date().toISOString(),
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
