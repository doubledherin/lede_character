require("dotenv").config()

async function getNews() {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    throw new Error("Missing NEWS_API_KEY environment variable")
  }
  const query = "autocracy OR antidemocratic OR fascist OR fascism"
  const fromDate = new Date()
  // fromDate.setDate(fromDate.getDate() - 3)
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
module.exports = getNews
