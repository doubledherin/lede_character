const sqlite3 = require("sqlite3").verbose()

function getMostRecentAnalysisRunTimestamp() {
  // Update with your SQLite database file path
  const db = new sqlite3.Database("lede_character.db")

  db.get(
    "SELECT created_at FROM analysis_runs ORDER BY created_at DESC LIMIT 1",
    (err, row) => {
      if (err) {
        console.error("Error querying database:", err)
      } else if (row) {
        console.log("Most recent created_at:", row.created_at)
      } else {
        console.log("No analysis runs found.")
      }
      db.close()
    }
  )
}

getMostRecentAnalysisRunTimestamp()
