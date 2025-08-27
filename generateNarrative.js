const sqlite3 = require("sqlite3").verbose()
const fs = require("fs").promises
const path = require("path")
const readline = require("readline")
require("dotenv").config()

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DB_PATH = "./lede_character.db"

// Function to create readline interface for user input
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

// Function to ask user for confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface()
    rl.question(question, (answer) => {
      rl.close()
      resolve(
        answer.toLowerCase().trim() === "y" ||
          answer.toLowerCase().trim() === "yes"
      )
    })
  })
}

// Function to check if narrative exists for article
async function narrativeExists(articleId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH)
    db.get(
      "SELECT id FROM narratives WHERE article_id = ?",
      [articleId],
      (err, row) => {
        db.close()
        if (err) reject(err)
        else resolve(!!row)
      }
    )
  })
}

// Function to load and process prompt template
async function loadPrompt(article) {
  try {
    const promptPath = path.join(__dirname, "narrative-prompt.txt")
    let prompt = await fs.readFile(promptPath, "utf8")

    // Replace placeholders with article data
    prompt = prompt
      .replace("{{title}}", article.title)
      .replace("{{description}}", article.description)
      .replace("{{url}}", article.url)

    return prompt
  } catch (error) {
    throw new Error(`Failed to load prompt file: ${error.message}`)
  }
}

// Function to get an article row by ID
async function getArticleById(articleId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH)
    db.get("SELECT * FROM articles WHERE id = ?", [articleId], (err, row) => {
      db.close()
      if (err) reject(err)
      else resolve(row)
    })
  })
}

// Function to store narrative in database
async function saveNarrative(articleId, narrativeText) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH)

    // First check if a narrative exists for this article
    db.get(
      "SELECT id FROM narratives WHERE article_id = ?",
      [articleId],
      (err, row) => {
        if (err) {
          db.close()
          reject(err)
          return
        }

        if (row) {
          // Update existing narrative
          const updateStmt = db.prepare(`
          UPDATE narratives 
          SET narrative_text = ?, created_at = CURRENT_TIMESTAMP 
          WHERE article_id = ?
        `)

          updateStmt.run([narrativeText, articleId], function (err) {
            if (err) {
              reject(err)
              return
            }
            console.log(`Narrative updated for article ${articleId}`)
            resolve(row.id)
          })

          updateStmt.finalize()
          db.close()
        } else {
          // Insert new narrative
          const insertStmt = db.prepare(`
          INSERT INTO narratives (article_id, narrative_text)
          VALUES (?, ?)
        `)

          insertStmt.run([articleId, narrativeText], function (err) {
            if (err) {
              reject(err)
              return
            }

            const narrativeId = this.lastID
            console.log(`New narrative created with ID: ${narrativeId}`)
            resolve(narrativeId)
          })

          insertStmt.finalize()
          db.close()
        }
      }
    )
  })
}

async function generateNarrative(article) {
  const prompt = await loadPrompt(article)

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-1106-preview",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.85,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// Main function
async function main() {
  const articleId = process.argv[2]
  console.log("articleId:", articleId)
  if (!articleId) {
    console.error("Usage: node generateNarrative.js <articleId>")
    process.exit(1)
  }

  try {
    const article = await getArticleById(articleId)
    if (!article) {
      console.error("Article not found.")
      process.exit(1)
    }

    // Check if narrative already exists BEFORE generating
    const exists = await narrativeExists(articleId)
    if (exists) {
      const shouldOverwrite = await askConfirmation(
        `Article ${articleId} already has a narrative. Overwrite? (y/N): `
      )

      if (!shouldOverwrite) {
        console.log("Operation cancelled.")
        process.exit(0)
      }
    }

    console.log("Generating narrative...")
    const narrative = await generateNarrative(article)
    console.log("\n--- Generated Narrative ---")
    console.log(narrative)

    // Save the narrative to database
    console.log("\nSaving narrative to database...")
    const narrativeId = await saveNarrative(articleId, narrative)

    if (exists) {
      console.log(`Narrative updated for article ${articleId}`)
    } else {
      console.log(`New narrative created for article ${articleId}`)
    }
  } catch (err) {
    console.error("Error:", err.message)
  }
}

main()
