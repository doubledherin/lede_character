const readline = require("readline")
const { db } = require("./database")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve))
}

async function resetDatabase() {
  console.log("⚠️  DATABASE RESET UTILITY")
  console.log("=".repeat(50))
  console.log("This will permanently delete data from the following tables:")
  console.log("- user_sessions")
  console.log("- choices")
  console.log("- story_nodes")
  console.log("- narratives")
  console.log()
  console.log("Tables that will be PRESERVED:")
  console.log("- analysis_runs")
  console.log("- articles")
  console.log()

  // First confirmation
  const firstConfirm = await ask(
    "Are you absolutely sure you want to continue? Type 'yes' to proceed: "
  )
  if (firstConfirm !== "yes") {
    console.log("Reset cancelled.")
    rl.close()
    return
  }

  // Individual table confirmations
  const tables = [
    {
      name: "user_sessions",
      description: "all user session data and story progress",
    },
    {
      name: "choices",
      description: "all story choice data and branching logic",
    },
    {
      name: "story_nodes",
      description: "all story content and narrative text",
    },
    { name: "narratives", description: "all narrative metadata and titles" },
  ]

  for (const table of tables) {
    console.log(`\n🗑️  Preparing to delete: ${table.name}`)
    console.log(`   This contains: ${table.description}`)

    const confirm = await ask(
      `Type 'DELETE ${table.name.toUpperCase()}' to confirm deletion: `
    )
    const expected = `DELETE ${table.name.toUpperCase()}`

    if (confirm !== expected) {
      console.log(`❌ Incorrect confirmation. Expected: '${expected}'`)
      console.log("Reset cancelled.")
      rl.close()
      return
    }

    console.log(`✅ Confirmed deletion of ${table.name}`)
  }

  // Final confirmation
  console.log("\n🚨 FINAL WARNING")
  const finalConfirm = await ask("Type 'I AM SURE' for final confirmation: ")
  if (finalConfirm !== "I AM SURE") {
    console.log("Reset cancelled.")
    rl.close()
    return
  }

  // Actually perform the reset
  console.log("\n🔄 Resetting database...")

  db.serialize(() => {
    // Drop tables in reverse order of dependencies
    db.run("DROP TABLE IF EXISTS user_sessions", (err) => {
      if (err) console.error("Error dropping user_sessions:", err)
      else console.log("✅ Dropped user_sessions")
    })

    db.run("DROP TABLE IF EXISTS choices", (err) => {
      if (err) console.error("Error dropping choices:", err)
      else console.log("✅ Dropped choices")
    })

    db.run("DROP TABLE IF EXISTS story_nodes", (err) => {
      if (err) console.error("Error dropping story_nodes:", err)
      else console.log("✅ Dropped story_nodes")
    })

    db.run("DROP TABLE IF EXISTS narratives", (err) => {
      if (err) console.error("Error dropping narratives:", err)
      else console.log("✅ Dropped narratives")

      console.log("\n✨ Database reset complete!")
      console.log(
        "New tables will be created automatically on next script run."
      )
      console.log("\nPreserved tables:")
      console.log("- analysis_runs (your article analysis history)")
      console.log("- articles (your curated articles)")

      rl.close()
      db.close()
    })
  })
}

if (require.main === module) {
  resetDatabase().catch(console.error)
}
