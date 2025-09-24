require("dotenv").config({ silent: true })
const readline = require("readline")
const { db } = require("./database")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve))
}

async function getStartNode(narrativeId) {
  return new Promise((resolve, reject) => {
    // Start node = node with no incoming choices
    db.get(
      `
      SELECT s.* FROM story_nodes s 
      WHERE s.narrative_id = ? 
      AND NOT EXISTS (
        SELECT 1 FROM choices c WHERE c.child_node_id = s.id
      )
    `,
      [narrativeId],
      (err, row) => {
        if (err) reject(err)
        else resolve(row)
      }
    )
  })
}

async function getNodeChoices(narrativeId, nodeId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT choice_text, choice_order, child_node_id
      FROM choices 
      WHERE narrative_id = ? AND parent_node_id = ?
      ORDER BY choice_order
    `,
      [narrativeId, nodeId],
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      }
    )
  })
}

async function getNode(narrativeId, nodeId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT * FROM story_nodes 
      WHERE narrative_id = ? AND id = ?
    `,
      [narrativeId, nodeId],
      (err, row) => {
        if (err) reject(err)
        else resolve(row)
      }
    )
  })
}

async function playNarrative(articleId) {
  return new Promise((resolve, reject) => {
    // Get narrative for this article
    db.get(
      "SELECT * FROM narratives WHERE article_id = ?",
      [articleId],
      async (err, narrative) => {
        if (err) {
          reject(err)
          return
        }

        if (!narrative) {
          console.log("No narrative found for this article.")
          console.log("Run: node generateNarrative.js " + articleId)
          resolve()
          return
        }

        try {
          await playStory(narrative.id, narrative.title)
          resolve()
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

async function playStory(narrativeId, title) {
  console.log("\n" + "=".repeat(60))
  console.log(`🎭 ${title}`)
  console.log("=".repeat(60) + "\n")

  // Start from the beginning
  const startNode = await getStartNode(narrativeId)
  if (!startNode) {
    console.log("Error: No start node found for this narrative.")
    return
  }

  let currentNode = startNode
  const pathTaken = [currentNode.id]

  while (currentNode) {
    // Display current node content
    console.log(currentNode.content)
    console.log()

    // Get choices for this node
    const choices = await getNodeChoices(narrativeId, currentNode.id)

    if (choices.length === 0) {
      // This is an ending
      console.log("🏁 THE END")
      console.log("=".repeat(60))

      // Show the path taken
      console.log(`\nPath taken: ${pathTaken.join(" → ")}`)
      break
    }

    // Display choices
    console.log("What do you do?")
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice.choice_text}`)
    })

    // Get user choice
    let selectedChoice = null
    while (!selectedChoice) {
      const answer = await ask(
        "\n👉 Enter your choice (1-" + choices.length + "): "
      )
      const choiceNum = parseInt(answer)

      if (choiceNum >= 1 && choiceNum <= choices.length) {
        selectedChoice = choices[choiceNum - 1]
      } else {
        console.log("Invalid choice. Please try again.")
      }
    }

    // Move to next node
    currentNode = await getNode(narrativeId, selectedChoice.child_node_id)
    pathTaken.push(currentNode.id)

    console.log(`\nYou chose: ${selectedChoice.choice_text}`)
    console.log("-".repeat(40) + "\n")
  }
}

async function main() {
  const articleId = process.argv[2]

  if (!articleId) {
    console.log("Usage: node playNarrative.js <articleId>")
    console.log("Example: node playNarrative.js 5")
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
