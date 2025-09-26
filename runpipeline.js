require("dotenv").config({ silent: true })
const { exec } = require("child_process")
const { promisify } = require("util")

const execAsync = promisify(exec)

async function runDailyPipeline() {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`🌅 DAILY AUTOMATION - ${new Date().toISOString()}`)
  console.log(`${"=".repeat(60)}`)

  try {
    // Step 1: Fetch and curate new articles
    console.log("📰 Step 1: Fetching and curating articles...")
    const { stdout: mainOutput } = await execAsync("node main.js")
    console.log("✅ Article curation complete")

    // Step 2: Generate narratives for any articles without them
    console.log(
      "🎭 Step 2: Generating narratives for new articles (this may take some time)..."
    )
    const { stdout: narrativeOutput } = await execAsync(
      "node generateAllNarratives.js --confirm"
    )
    console.log("✅ Narrative generation complete")

    console.log(
      `\n🎉 Daily automation completed successfully at ${new Date().toLocaleString()}`
    )
    console.log("📊 Check your narratives with: node chooseAndPlay.js")
  } catch (error) {
    console.error(`❌ Daily automation failed: ${error.message}`)
    console.error("Check logs and run manually if needed")
  }
}

// Just run once and exit
runDailyPipeline().then(() => {
  console.log("🏁 Daily automation script finished")
  process.exit(0)
})
