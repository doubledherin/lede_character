require("dotenv").config({ silent: true })

const {
  getMostRecentAnalysisRunTimestamp,
  getRecentArticles,
  curateArticles,
} = require("./helpers")

async function main() {
  /// Get most recent analysis run timestamp
  const timestamp = await getMostRecentAnalysisRunTimestamp()
  console.log("Most Recent Analysis Run Timestamp:", timestamp)

  /// Get recent articles
  const { articles } = await getRecentArticles()

  /// Curate articles
  const { acceptedArticles, totalArticles, analysisResponse } =
    await curateArticles(articles)
  console.log("Accepted Articles:", acceptedArticles)
  console.log("Total Articles:", totalArticles)
  console.log("Analysis Response:", analysisResponse)
  console.log(
    `Filtered ${acceptedArticles.length} accepted articles from ${articles.length} total`
  )
  /// Save analysis run
}

if (require.main === module) {
  main().catch(console.error)
}
