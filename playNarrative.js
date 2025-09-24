const sqlite3 = require("sqlite3").verbose()
const fs = require("fs").promises
const path = require("path")
const readline = require("readline")
const { parseNarrativeText, saveNarrativeGraph } = require("./narrativeParser")

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DB_PATH = "./lede_character.db"
const db = new sqlite3.Database(DB_PATH)

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

async function generateNarrative(articleId) {
  return new Promise((resolve, reject) => {
    // Check if narrative already exists
    db.get(
      "SELECT id FROM narratives WHERE article_id = ?",
      [articleId],
      async (err, existingNarrative) => {
        if (err) {
          reject(err)
          return
        }

        if (existingNarrative) {
          const shouldOverwrite = await askConfirmation(
            `A narrative already exists for article ${articleId}. Overwrite? (y/n): `
          )

          if (!shouldOverwrite) {
            console.log("Narrative generation cancelled.")
            resolve()
            return
          }

          // Delete existing narrative and related data
          db.serialize(() => {
            db.run("DELETE FROM choices WHERE narrative_id = ?", [
              existingNarrative.id,
            ])
            db.run("DELETE FROM story_nodes WHERE narrative_id = ?", [
              existingNarrative.id,
            ])
            db.run("DELETE FROM narratives WHERE id = ?", [
              existingNarrative.id,
            ])
          })
        }

        // Get the article
        db.get(
          "SELECT * FROM articles WHERE id = ?",
          [articleId],
          async (err, article) => {
            if (err) {
              reject(err)
              return
            }

            if (!article) {
              console.log("Article not found")
              resolve()
              return
            }

            try {
              console.log(`Generating narrative for: ${article.title}`)

              // Load and prepare prompt
              const promptPath = path.join(__dirname, "narrative-prompt.txt")
              let prompt = await fs.readFile(promptPath, "utf8")

              prompt = prompt
                .replace(/{{articleTitle}}/g, article.title)
                .replace(/{{articleDescription}}/g, article.description)
                .replace(
                  /{{articleContent}}/g,
                  `${article.title}\n\n${article.description}`
                )

              // Call OpenAI API
              const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: "gpt-4-1106-preview",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 4096,
                    temperature: 0.85,
                  }),
                }
              )

              const data = await response.json()
              const narrativeText = data.choices[0].message.content

              // Parse the structured narrative
              const { nodeContents, choiceData } =
                parseNarrativeText(narrativeText)

              console.log(
                `Parsed ${nodeContents.length} nodes and ${choiceData.length} choices`
              )

              // Save to database as graph structure
              const narrativeId = await saveNarrativeGraph(
                articleId,
                article.title,
                nodeContents,
                choiceData
              )

              console.log(`Narrative saved with ID: ${narrativeId}`)
              resolve(narrativeId)
            } catch (error) {
              reject(error)
            }
          }
        )
      }
    )
  })
}

async function main() {
  const articleId = process.argv[2]

  if (!articleId) {
    console.log("Usage: node generateNarrative.js <articleId>")
    console.log("Example: node generateNarrative.js 5")
    process.exit(1)
  }

  try {
    await generateNarrative(parseInt(articleId))
  } catch (error) {
    console.error("Error generating narrative:", error)
    process.exit(1)
  } finally {
    db.close()
  }
}

if (require.main === module) {
  main()
}
