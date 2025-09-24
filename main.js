require("dotenv").config({ quiet: true })

const {
  getMostRecentAnalysisRunTimestamp,
  getRecentArticles,
  curateArticles,
} = require("./helpers")
const { saveAnalysisRun } = require("./database")

async function main() {
  try {
    /// Get most recent analysis run timestamp
    const timestamp = await getMostRecentAnalysisRunTimestamp()
    console.log("Most Recent Analysis Run Timestamp:", timestamp)

    /// Get recent articles
    const { articles } = await getRecentArticles()
    const limitedArticles = articles.slice(0, 10) // Reduced for MVP purposes
    console.log(`Processing ${limitedArticles.length} articles`)

    /// Curate articles
    const { acceptedArticles, totalArticles, analysisResponse } =
      await curateArticles(articles)
    console.log(
      `Accepted ${acceptedArticles.length} articles from ${totalArticles} total`
    )

    // Save analysis run
    const runId = await saveAnalysisRun(totalArticles, acceptedArticles)
    console.log(`Analysis run saved with ID: ${runId}`)

    // Generate narrative for the first accepted article (MVP scope)
    if (acceptedArticles.length > 0) {
      console.log("Generating narrative for first article...")
      const { exec } = require("child_process")

      // Get the article ID from database (you'll need to query for it)
      const firstArticleId = acceptedArticles[0].id // Assuming you store the ID

      exec(
        `node generateNarrative.js ${firstArticleId}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error("Error generating narrative:", error)
          } else {
            console.log("Narrative generated successfully!")
            console.log(stdout)
          }
        }
      )
    }
  } catch (error) {
    console.error("Pipeline error:", error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
