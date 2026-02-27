require("dotenv").config({ silent: true })
const { spawn } = require("child_process")

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: ${command} ${args.join(" ")}`)

    const process = spawn(command, args, {
      stdio: "inherit", // Shows real-time output
      cwd: __dirname,
    })

    process.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    process.on("error", (error) => {
      reject(error)
    })
  })
}

async function runDailyPipeline() {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`🌅 DAILY AUTOMATION - ${new Date().toISOString()}`)
  console.log(`${"=".repeat(60)}`)

  try {
    // Step 1: Fetch and curate new articles
    console.log("📰 Step 1: Fetching and curating articles...")
    await runCommand("node", ["main.js"])
    console.log("✅ Article curation complete")

    // Step 2: Generate narratives for any articles without them
    console.log(
      "🎭 Step 2: Generating narratives for new articles (this may take some time)...",
    )
    await runCommand("node", ["generateAllNarratives.js", "--confirm"])
    console.log("✅ Narrative generation complete")

    console.log(
      `\n🎉 Daily automation completed successfully at ${new Date().toLocaleString()}`,
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
