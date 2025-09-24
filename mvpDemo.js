require("dotenv").config({ quiet: true })
const { exec } = require("child_process")
const { db } = require("./database")

async function runMVPDemo() {
  console.log("🚀 Starting MVP Demo: News to Interactive Narrative")
  console.log("=".repeat(60))

  try {
    // Step 1: Run the pipeline
    console.log("\n📰 Step 1: Fetching and curating articles...")
    await execPromise("node main.js")

    // Step 2: Get the latest article
    console.log("\n📝 Step 2: Finding latest article...")
    const articleId = await getLatestArticleId()

    if (!articleId) {
      console.log("No articles found. Run 'node main.js' first.")
      return
    }

    // Step 3: Generate narrative
    console.log(
      `\n✍️  Step 3: Generating narrative for article ${articleId}...`
    )
    await execPromise(`node generateNarrative.js ${articleId}`)

    // Step 4: Play the narrative
    console.log(`\n🎭 Step 4: Playing interactive narrative...`)
    console.log("=".repeat(60))
    await execPromise(`node playNarrative.js ${articleId}`)
  } catch (error) {
    console.error("Demo failed:", error)
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        console.log(stdout)
        resolve(stdout)
      }
    })
  })
}

function getLatestArticleId() {
  return new Promise((resolve) => {
    db.get(
      "SELECT id FROM articles ORDER BY created_at DESC LIMIT 1",
      (err, row) => {
        resolve(row ? row.id : null)
      }
    )
  })
}

if (require.main === module) {
  runMVPDemo()
}
