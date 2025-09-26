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
      await curateArticles(limitedArticles)
    console.log(
      `Accepted ${acceptedArticles.length} articles from ${totalArticles} total`
    )

    // Save analysis run
    const runId = await saveAnalysisRun(totalArticles, acceptedArticles)
    console.log(`Analysis run saved with ID: ${runId}`)

    // Generate narrative for the first accepted article (MVP scope)
    // Replace the broken section at the end of main.js with this:
    if (acceptedArticles.length > 0) {
      console.log("\n🎭 TIP: Generate narratives for your new articles:")
      console.log("  node generateAllNarratives.js")
      console.log("\n📚 Then browse and play stories:")
      console.log("  node chooseAndPlay.js")
    } else {
      console.log("\n❌ No articles were accepted for narrative generation.")
      console.log("Try running again later for different news content.")
    }

    console.log(`\n✅ Analysis complete! Run ID: ${runId}`)
  } catch (error) {
    console.error("Pipeline error:", error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
