require("dotenv").config()

const getRecentArticles = require("./getRecentArticles")
const { saveAnalysisRun } = require("./database")

function extractJSONFromMarkdown(text) {
  // Remove markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  // If no code blocks found, return the original text
  return text.trim()
}

async function main() {
  const data = await getRecentArticles()
  const articles = data.articles.slice(0, 50)

  const prompt = `
You are an expert narrative designer. 
Below is a list of recent news articles about the rise of autocracy and/or the decline of democracy.


Tasks:
1. IMPORTANT: Reject articles centered on fictional content (movies, books, etc.)
2. Reject articles not focused on autocracy or decline of democracy
3. Select the best 10 articles for choose-your-own-adventure narrative
4. For each selected article, provide a brief description and a narrative feasibility rating (high, medium, low)

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting, no code blocks.

The JSON should have this exact structure:
{
  "acceptedArticles": [
    {
      "index": 2,
      "title": "Article title",
      "description": "Brief description of the article",
      "url": "https://example.com/article-url",
      "author": "Author Name",
      "publishedAt": "2023-01-01T00:00:00Z",
      "source": "Source Name"
      "narrativeFeasibility": "high" // or "medium", "low"
    }
  ]
}


Articles:
${articles
  .map((a, i) => `\n${i + 1}. "${a.title}" - ${a.description}`)
  .join("")}
`

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable")
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4-1106-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  })

  const dataAI = await response.json()
  const reply = dataAI.choices?.[0]?.message?.content
  if (!reply) {
    throw new Error("No response from AI")
  }

  // Extract JSON from markdown if needed
  const cleanedReply = extractJSONFromMarkdown(reply)

  // Parse the JSON response
  let analysis
  try {
    analysis = JSON.parse(cleanedReply)
  } catch (error) {
    throw new Error("Failed to parse AI response as JSON: " + error.message)
  }

  // Filter only accepted articles
  const acceptedArticles = articles.filter((article, index) =>
    analysis.acceptedArticles.some((accepted) => accepted.index === index + 1)
  )

  // Save to database with analysis run tracking
  try {
    const runId = await saveAnalysisRun(articles.length, acceptedArticles)
    console.log(`\nAnalysis run saved with ID: ${runId}`)
  } catch (error) {
    console.error("Error saving to database:", error)
  }
}

main()
