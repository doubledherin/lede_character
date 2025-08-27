# Lede Character - News-to-Narrative Generator

A Node.js application that fetches recent news articles about autocracy and uses OpenAI's GPT to identify the best candidates for creating immersive, choose-your-own-adventure stories.

## Overview

This project combines news aggregation with AI-powered narrative analysis to:

1. Fetch recent news articles about autocracy, fascism, and antidemocratic movements
2. Analyze which articles would make compelling interactive fiction
3. Generate character roles and plot suggestions for narrative adaptation

## Features

- **News Fetching**: Retrieves articles from NewsAPI based on autocracy-related keywords
- **AI Analysis**: Uses OpenAI's GPT-4 to evaluate narrative potential
- **Date Filtering**: Searches articles from the past month
- **Environment Configuration**: Secure API key management with dotenv

## Prerequisites

- Node.js v18+ (for built-in fetch support)
- npm or yarn package manager
- NewsAPI account and API key
- OpenAI account and API key

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd lede_character
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:

```env
NEWS_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

4. Get your API keys:
   - **NewsAPI**: Sign up at [newsapi.org](https://newsapi.org/) for a free API key
   - **OpenAI**: Get your API key from [platform.openai.com](https://platform.openai.com/)

## Usage

### Fetch News Articles

To fetch and display news articles:

```bash
node rungetRecentArticles.js
```

### Generate Narrative Analysis

To analyze articles for narrative potential:

```bash
node openAI.js
```

This will:

1. Fetch the latest 20 articles about autocracy
2. Send them to OpenAI for analysis
3. Return suggestions for which articles would make the best interactive stories

## File Structure

```
lede_character/

├── curateArticles.js     # Curates and filters news articles
├── database.js           # Handles SQLite database

operations
├── generateNarrative.js  # Generates narrative suggestions

using OpenAI
├── getRecentArticles.js  # Fetches recent news articles
├── lede_character.db     # SQLite database file
├── narrative-prompt.txt  # Prompt template for narrative

generation
├── package.json          # Project dependencies and scripts
└── README.md             # Documentation
```

## API Configuration

### NewsAPI Query Parameters

- **Query**: `"autocracy OR antidemocratic OR fascist OR fascism"`
- **Date Range**: Past month from current date
- **Sort**: By popularity
- **Limit**: 20 articles for analysis

### OpenAI Configuration

- **Model**: `gpt-4-1106-preview`
- **Temperature**: 0.7 (balanced creativity)
- **Role**: Expert narrative designer

## Environment Variables

| Variable         | Description                                | Required |
| ---------------- | ------------------------------------------ | -------- |
| `NEWS_API_KEY`   | Your NewsAPI key for fetching articles     | Yes      |
| `OPENAI_API_KEY` | Your OpenAI API key for narrative analysis | Yes      |

## Error Handling

The application includes error handling for:

- Missing environment variables
- API request failures
- Invalid API responses
- Network connectivity issues

## Rate Limits

Be aware of API rate limits:

- **NewsAPI**: 1,000 requests/month (free tier)
- **OpenAI**: Varies by plan and model

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security Notes

- Never commit your `.env` file
- Rotate API keys regularly
- Monitor API usage to avoid unexpected charges

## License

[Add your license information here]

## Troubleshooting

### Common Issues

**"fetch is not a function"**

- Ensure you're using Node.js v18+ or install node-fetch for older versions

**"Missing API key"**

- Check that your `.env` file exists and contains valid API keys
- Verify the variable names match exactly

**No articles returned**

- Check your NewsAPI key validity
- Verify your search query isn't too restrictive
- Ensure you haven't exceeded rate limits

## Future Enhancements

- Add support for multiple news sources
- Implement article caching
- Create web interface
- Add story generation capabilities
- Include sentiment analysis
