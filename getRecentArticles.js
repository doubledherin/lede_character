require("dotenv").config()

async function getRecentArticles() {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    throw new Error("Missing NEWS_API_KEY environment variable")
  }
  const query =
    'autocracy OR autocratic OR antidemocratic OR fascist OR fascism OR far-right OR "far right" OR authoritarian OR authoritarianism OR dictatorship OR totalitarianism OR populism OR populist OR demagogue OR demagoguery OR demagogy OR demagogic OR autocrat OR autocratic OR despotism OR despot OR tyrant OR tyranny'
  const fromDate = new Date()
  fromDate.setMonth(fromDate.getMonth() - 1)
  const from = fromDate.toISOString().split("T")[0]

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&from=${from}&sortBy=popularity&apiKey=${encodeURIComponent(apiKey)}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
  return data
}

module.exports = getRecentArticles
