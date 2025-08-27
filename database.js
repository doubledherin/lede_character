const sqlite3 = require("sqlite3").verbose()
const path = require("path")

const dbPath = path.join(__dirname, "lede_character.db")
const db = new sqlite3.Database(dbPath)

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
    const stmt = db.prepare(`
      INSERT INTO analysis_runs (total_articles, accepted_articles)
      VALUES (?, ?)
    `)

    stmt.run([totalArticles, acceptedArticles.length], function (err) {
      if (err) {
        reject(err)
        return
      }

      const runId = this.lastID

      const articleStmt = db.prepare(`
        INSERT INTO articles (run_id, title, description, url, author, published_at, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      acceptedArticles.forEach((article) => {
        articleStmt.run([
          runId,
          article.title,
          article.description,
          article.url,
          article.author,
          article.publishedAt,
          article.source?.name,
        ])
      })

      articleStmt.finalize((err) => {
        if (err) reject(err)
        else resolve(runId)
      })
    })

    stmt.finalize()
  })
}

function getRecentRuns(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT id, created_at, total_articles, accepted_articles,
             (accepted_articles * 100.0 / total_articles) as acceptance_rate
      FROM analysis_runs 
      ORDER BY created_at DESC 
      LIMIT ?
    `,
      [limit],
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      }
    )
  })
}

function getRunDetails(runId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT * FROM analysis_runs WHERE id = ?
    `,
      [runId],
      (err, run) => {
        if (err) {
          reject(err)
          return
        }

        db.all(
          `
        SELECT * FROM articles WHERE run_id = ?
      `,
          [runId],
          (err, articles) => {
            if (err) reject(err)
            else resolve({ run, articles })
          }
        )
      }
    )
  })
}

module.exports = { db, saveAnalysisRun, getRecentRuns, getRunDetails }
