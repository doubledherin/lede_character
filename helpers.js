const path = require("path")
const fs = require("fs").promises

const { db } = require("./database")
const { time } = require("console")

/**
 * Retrieves the timestamp of the most recent analysis run from the local SQLite database.
 * The function queries the 'analysis_runs' table and returns the latest 'created_at' value.
 *
 * @returns {Promise<string|null>} Resolves with the timestamp string of the most recent analysis run,
 * or null if no runs are found.
 * @example
 * const timestamp = await getMostRecentAnalysisRunTimestamp();
 * console.log(timestamp); // e.g., "2024-06-01T12:34:56.000Z"
 */
function getMostRecentAnalysisRunTimestamp() {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT created_at FROM analysis_runs ORDER BY created_at DESC LIMIT 1",
      (err, row) => {
        db.close()

        if (err) {
          reject(err)
        } else if (row) {
          resolve(row.created_at)
        } else {
          resolve(null) // No analysis runs found
        }
      }
    )
  })
}

function isValidArticleUrl(url) {
  if (!url || typeof url !== "string") return false

  const invalidPatterns = [
    "example.com",
    "removed.com",
    "localhost",
    "[Removed]",
  ]

  return (
    url.startsWith("http") &&
    !invalidPatterns.some((pattern) => url.includes(pattern))
  )
}

/**
 * Fetches recent news articles related to autocracy, authoritarianism, and similar topics
 * from the NewsAPI service, using a query of relevant keywords. The function retrieves articles
 * from the specified timestamp or past month if no timestamp provided, sorted by popularity.
 *
 * @async
 * @param {string|null} timestamp - ISO timestamp to fetch articles from. If null, uses past month.
 * @throws {Error} If the NEWS_API_KEY environment variable is missing or if the HTTP request fails.
 * @returns {Promise<Object>} Resolves with the response data from NewsAPI containing articles.
 * @example
 * const result = await getRecentArticles("2024-06-01T12:34:56.000Z");
 * console.log(result.articles); // Array of recent articles since timestamp
 */
async function getRecentArticles(timestamp) {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    throw new Error("Missing NEWS_API_KEY environment variable")
  }

  const query =
    'autocracy OR autocratic OR antidemocratic OR fascist OR fascism OR far-right OR "far right" OR authoritarian OR authoritarianism OR dictatorship OR totalitarianism OR populism OR populist OR demagogue OR demagoguery OR demagogy OR demagogic OR autocrat OR autocratic OR despotism OR despot OR tyrant OR tyranny'

  if (timestamp) {
    console.log("Fetching articles since:", timestamp.toISOString())
  } else {
    console.log("Fetching articles from past month")
  }
  const from =
    timestamp ||
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&from=${from}&sortBy=popularity&apiKey=${encodeURIComponent(apiKey)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
  if (data.articles) {
    data.articles = data.articles.filter((article) =>
      isValidArticleUrl(article.url)
    )
  }

  return data
}

async function curateArticles(articles) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable")
  }

  const prompt = await loadCurationPrompt(articles)

  console.log("Using GPT-4 for curation...")
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
  let parsedResponse
  try {
    parsedResponse = JSON.parse(cleanedReply)
  } catch (error) {
    throw new Error("Failed to parse AI response as JSON: " + error.message)
  }

  // Filter only accepted articles
  const acceptedArticles = articles.filter((_, index) =>
    parsedResponse.acceptedArticles.some(
      (accepted) => accepted.index === index + 1
    )
  )

  console.log(
    `Curated! Filtered ${acceptedArticles.length} accepted articles from ${articles.length} total`
  )

  return {
    acceptedArticles,
    totalArticles: articles.length,
    analysisResponse: parsedResponse,
  }
}

/**
 * Loads a curation prompt template from a file and injects a formatted list of articles into it.
 * The function reads 'curation-prompt.txt', replaces the '{{articles}}' placeholder with article titles
 * and descriptions, and returns the final prompt string.
 *
 * @async
 * @param {Array<{title: string, description: string}>} articles - Array of article objects to include in the prompt.
 * @throws {Error} If the prompt file cannot be loaded.
 * @returns {Promise<string>} Resolves with the formatted curation prompt string.
 * @example
 * const prompt = await loadCurationPrompt([{title: "Title", description: "Desc"}]);
 * console.log(prompt); // Prompt with articles injected
 */
async function loadCurationPrompt(articles) {
  try {
    const promptPath = path.join(__dirname, "curation-prompt.txt")
    let prompt = await fs.readFile(promptPath, "utf8")

    // Format articles for the template
    const formattedArticles = articles
      .map((a, i) => `\n${i + 1}. "${a.title}" - ${a.description}`)
      .join("")

    // Replace placeholder with actual articles
    prompt = prompt.replace("{{articles}}", formattedArticles)

    return prompt
  } catch (error) {
    throw new Error(`Failed to load curation prompt file: ${error.message}`)
  }
}

/**
 * Extracts JSON content from a markdown-formatted string, specifically from a code block.
 * If a JSON code block is found, its contents are returned; otherwise, the original text is trimmed and returned.
 *
 * @param {string} text - The markdown-formatted string potentially containing a JSON code block.
 * @returns {string} The extracted JSON string or the trimmed original text.
 * @example
 * const json = extractJSONFromMarkdown('```json\n{"key":"value"}\n```');
 * console.log(json); // '{"key":"value"}'
 */
function extractJSONFromMarkdown(text) {
  // Remove markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  // If no code blocks found, return the original text
  return text.trim()
}

function saveAnalysisRun(totalArticles, acceptedArticles) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO analysis_runs (total_articles, accepted_articles)
      VALUES (?, ?)
    `)

    stmt.run([totalArticles, acceptedArticles.length], function (err) {
      if (err) {
        reject(err)
        return
      }

      const runId = this.lastID

      const articleStmt = db.prepare(`
        INSERT INTO articles (run_id, title, description, url, author, published_at, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      acceptedArticles.forEach((article) => {
        articleStmt.run([
          runId,
          article.title,
          article.description,
          article.url,
          article.author,
          article.publishedAt,
          article.source?.name,
        ])
      })

      articleStmt.finalize((err) => {
        if (err) reject(err)
        else resolve(runId)
      })
    })

    stmt.finalize()
  })
}

function getRecentRuns(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT id, created_at, total_articles, accepted_articles,
             (accepted_articles * 100.0 / total_articles) as acceptance_rate
      FROM analysis_runs 
      ORDER BY created_at DESC 
      LIMIT ?
    `,
      [limit],
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      }
    )
  })
}

function getRunDetails(runId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT * FROM analysis_runs WHERE id = ?
    `,
      [runId],
      (err, run) => {
        if (err) {
          reject(err)
          return
        }

        db.all(
          `
        SELECT * FROM articles WHERE run_id = ?
      `,
          [runId],
          (err, articles) => {
            if (err) reject(err)
            else resolve({ run, articles })
          }
        )
      }
    )
  })
}

module.exports = {
  getRecentArticles,
  getMostRecentAnalysisRunTimestamp,
  curateArticles,
  extractJSONFromMarkdown,
  loadCurationPrompt,
  saveAnalysisRun,
  getRecentRuns,
  getRunDetails,
  extractJSONFromMarkdown,
}
