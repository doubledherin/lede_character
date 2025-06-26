const getNews = require("./getNews")

getNews()
  .then((data) => {
    const articleCount = data.totalResults
    console.log("TOTAL COUNT", articleCount)
    const articles = data.articles
    return articles.slice(0, 20)
    // console.log(JSON.stringify(data, null, 2))
  })
  .catch((err) => {
    console.error("Error:", err)
  })
