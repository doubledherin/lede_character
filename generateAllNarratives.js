require("dotenv").config({ silent: true })
const { db } = require("./database")
const fs = require("fs").promises
const path = require("path")
const { parseNarrativeText, saveNarrativeGraph } = require("./narrativeParser")

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

async function getAllArticlesWithoutNarratives() {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT a.* FROM articles a 
      LEFT JOIN narratives n ON a.id = n.article_id 
      WHERE n.id IS NULL
      ORDER BY a.created_at DESC
    `,
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      }
    )
  })
}

async function loadNarrativePrompt(article) {
  try {
    const templatePath = path.join(__dirname, "narrative-prompt.txt")
    let template = await fs.readFile(templatePath, "utf8")

    // Replace template variables
    template = template.replace(/{{articleTitle}}/g, article.title || "")
    template = template.replace(
      /{{articleDescription}}/g,
      article.description || ""
    )
    template = template.replace(
      /{{articleContent}}/g,
      `Title: ${article.title}\nDescription: ${article.description}\nURL: ${article.url}`
    )

    return template
  } catch (error) {
    throw new Error(
      `Failed to load narrative prompt template: ${error.message}`
    )
  }
}

async function generateNarrativeForArticle(article) {
  console.log(
    `\n📝 Generating narrative for: "${article.title.substring(0, 60)}..."`
  )

  try {
    const prompt = await loadNarrativePrompt(article)

    console.log("🤖 Calling OpenAI API...")
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-1106-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("data", data)
    const narrativeText = data.choices[0].message.content
    console.log("narrativeText", narrativeText)
    console.log("📊 Parsing narrative structure...")
    const { nodeContents, choiceData } = parseNarrativeText(narrativeText)

    console.log(`   - Found ${nodeContents.length} nodes`)
    console.log(`   - Found ${choiceData.length} choices`)

    if (nodeContents.length === 0) {
      throw new Error("No valid nodes found in AI response")
    }

    console.log("💾 Saving to database...")
    await saveNarrativeGraph(
      article.id,
      article.title,
      nodeContents,
      choiceData
    )

    console.log("✅ Narrative generated successfully!")
    return true
  } catch (error) {
    console.error(`❌ Failed to generate narrative: ${error.message}`)
    return false
  }
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error("❌ Missing OPENAI_API_KEY environment variable")
    process.exit(1)
  }

  try {
    console.log("🔍 Finding articles without narratives...")
    const articles = await getAllArticlesWithoutNarratives()

    if (articles.length === 0) {
      console.log("✅ All articles already have narratives!")
      return
    }

    console.log(`📋 Found ${articles.length} articles without narratives:`)
    articles.forEach((article, index) => {
      console.log(
        `   ${index + 1}. [ID:${article.id}] ${article.title.substring(
          0,
          80
        )}...`
      )
    })

    // Optional: Ask for confirmation
    if (articles.length > 5) {
      console.log(`\n⚠️  This will generate ${articles.length} narratives.`)
      console.log(
        `💰 Estimated cost: $${(articles.length * 0.2).toFixed(
          2
        )} (approx $0.20 per narrative)`
      )

      // Simple confirmation - you could make this interactive
      const confirm =
        process.argv.includes("--confirm") || process.argv.includes("-y")
      if (!confirm) {
        console.log(
          "\nAdd --confirm or -y flag to proceed automatically, or Ctrl+C to cancel."
        )
        console.log("Example: node generateAllNarratives.js --confirm")

        // Wait a few seconds then proceed (or make this interactive)
        console.log("Proceeding in 5 seconds... (Ctrl+C to cancel)")
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }

    let successCount = 0
    let failureCount = 0
    let failureIds = []

    console.log("\n🚀 Starting batch narrative generation...")

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      console.log(
        `\n[${i + 1}/${articles.length}] Processing article ${article.id}`
      )

      const success = await generateNarrativeForArticle(article)

      if (success) {
        successCount++
      } else {
        failureCount++
        failureIds.push(article.id)
      }

      // Add delay to avoid rate limits
      if (i < articles.length - 1) {
        console.log("⏱️  Waiting 2 seconds to avoid rate limits...")
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    console.log("\n" + "=".repeat(60))
    console.log("📊 BATCH GENERATION COMPLETE")
    console.log("=".repeat(60))
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failureCount}`)
    console.log(`📜 Failed Article IDs: ${failureIds.join(", ")}`)
    console.log(
      `📈 Success Rate: ${((successCount / articles.length) * 100).toFixed(1)}%`
    )

    if (successCount > 0) {
      console.log(`\n🎮 Test your new narratives with:`)
      console.log(`node playNarrative.js <articleId>`)
    }
  } catch (error) {
    console.error("Fatal error:", error)
  } finally {
    db.close()
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  generateNarrativeForArticle,
  getAllArticlesWithoutNarratives,
}
