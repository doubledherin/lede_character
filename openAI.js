require("dotenv").config()
const getNews = require("./getNews")

async function main() {
  const data = await getNews()
  const articles = data.articles.slice(0, 20)

  const prompt = `
You are an expert narrative designer. Below is a list of recent news articles about the rise of autocracy around the world. 

Eliminate any articles that aren't ideal for being transformed into an evocative second-person, immersive, choose-your-own-adventure story. Briefly explain which articles have been eliminated (citing just their headlines), and explain why they aren't good candidates for this project. Next provide the number of articles that were eliminated, and the number of articles that remain, along with a brief synopsis of what a compelling character role and plot might be if that article were to be chosen for this project.

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
  console.log("Best narrative article suggestion:\n", reply)
}

main()
