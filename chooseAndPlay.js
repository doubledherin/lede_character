require("dotenv").config({ silent: true })
const readline = require("readline")
const { db } = require("./database")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Update the ask function to use the current readline interface
function ask(question) {
  const currentRl = global.chooseAndPlayRl || rl
  return new Promise((resolve) => currentRl.question(question, resolve))
}

async function getAllNarratives() {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT n.*, a.title as article_title, a.description as article_description
      FROM narratives n
      JOIN articles a ON n.article_id = a.id
      ORDER BY n.created_at DESC
    `,
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      }
    )
  })
}

async function displayNarrativeMenu(narratives) {
  console.log("\n" + "=".repeat(70))
  console.log("🎭 INTERACTIVE NARRATIVES - Choose Your Story")
  console.log("=".repeat(70))

  if (narratives.length === 0) {
    console.log("\n❌ No narratives available!")
    console.log("Run one of these commands first:")
    console.log("  node main.js                    # Fetch and curate articles")
    console.log("  node generateNarrative.js <id>  # Generate single narrative")
    console.log("  node generateAllNarratives.js   # Generate all narratives")
    return null
  }

  console.log(`\nAvailable Stories (${narratives.length} total):\n`)

  narratives.forEach((narrative, index) => {
    console.log(`${index + 1}. 📚 "${narrative.title}"`)
    console.log(
      `   📰 Based on: "${narrative.article_title.substring(0, 80)}${
        narrative.article_title.length > 80 ? "..." : ""
      }"`
    )
    console.log()
  })

  console.log("0. ❌ Exit")
  console.log("-".repeat(70))

  let selectedIndex = null
  while (selectedIndex === null) {
    const answer = await ask(
      `\n👉 Choose a story (1-${narratives.length}, or 0 to exit): `
    )
    const choice = parseInt(answer)

    if (choice === 0) {
      return null
    } else if (choice >= 1 && choice <= narratives.length) {
      selectedIndex = choice - 1
    } else {
      console.log(
        `❌ Invalid choice. Please enter 1-${narratives.length} or 0 to exit.`
      )
    }
  }

  return narratives[selectedIndex]
}

async function playSelectedNarrative(narrative) {
  const { playStory } = require("./playNarrative")

  console.log(`\n🎬 Starting: "${narrative.title}"`)
  console.log(`📰 Based on the article: "${narrative.article_title}"`)
  console.log()

  const continueChoice = await ask(
    "Press Enter to begin, or 'q' to go back to menu: "
  )
  if (continueChoice.toLowerCase() === "q") {
    return false
  }

  try {
    await playStory(narrative.id, narrative.title)
    return true
  } catch (error) {
    console.error("❌ Error playing story:", error.message)
    return false
  }
}

async function main() {
  console.log("🎮 Welcome to Lede Character Interactive Stories!")

  // Set the global reference
  global.chooseAndPlayRl = rl

  try {
    while (true) {
      const narratives = await getAllNarratives()
      const selectedNarrative = await displayNarrativeMenu(narratives)

      if (!selectedNarrative) {
        console.log("\n👋 Thanks for using Lede Character!")
        break
      }

      const completed = await playSelectedNarrative(selectedNarrative)

      if (completed) {
        console.log("\n" + "=".repeat(70))
        console.log("🎉 Story Complete!")

        const playAgain = await ask(
          "\nWould you like to play another story? (y/n): "
        )
        if (
          playAgain.toLowerCase() !== "y" &&
          playAgain.toLowerCase() !== "yes"
        ) {
          console.log("\n👋 Thanks for playing!")
          break
        }
      }
    }
  } catch (error) {
    console.error("Fatal error:", error)
  } finally {
    rl.close()
    db.close()
  }
}

// Keep your existing code:
if (require.main === module) {
  main()
}
