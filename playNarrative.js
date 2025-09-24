require("dotenv").config({ quiet: true })

const readline = require("readline")
const { db } = require("./database")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve))
}

async function playNarrative(articleId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT narrative_text FROM narratives WHERE article_id = ?",
      [articleId],
      async (err, row) => {
        if (err) {
          reject(err)
          return
        }

        if (!row) {
          console.log("No narrative found for this article.")
          resolve()
          return
        }

        await playStory(row.narrative_text)
        resolve()
      }
    )
  })
}

async function playStory(narrativeText) {
  console.log("\n" + "=".repeat(60))
  console.log("🎭 INTERACTIVE NARRATIVE")
  console.log("=".repeat(60) + "\n")

  // TO DO: Improve prompt to be sure how to create branching structure
  // Simple parser - look for choice patterns like "1. Option A" or "A) Choice"
  const sections = narrativeText.split(/(?=\n\n.*?[1-9AB]\.|[1-9AB]\))/g)

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim()

    // Check if this section has choices
    const hasChoices = /[1-9AB]\.|[1-9AB]\)/.test(section)

    if (hasChoices) {
      console.log(section)

      if (i < sections.length - 1) {
        // Not the last section
        const choice = await ask("\n👉 Enter your choice: ")
        console.log(`\nYou chose: ${choice}\n`)
        console.log("-".repeat(40))
      }
    } else {
      console.log(section)

      if (i < sections.length - 1) {
        await ask("\n⏎ Press Enter to continue...")
        console.log()
      }
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("🏁 THE END")
  console.log("=".repeat(60))
}

async function main() {
  const articleId = process.argv[2]

  if (!articleId) {
    console.log("Usage: node playNarrative.js <articleId>")
    process.exit(1)
  }

  try {
    await playNarrative(parseInt(articleId))
  } catch (error) {
    console.error("Error:", error)
  } finally {
    rl.close()
    db.close()
  }
}

if (require.main === module) {
  main()
}
