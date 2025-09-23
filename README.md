# Lede Character - News-to-Narrative Generator

A Node.js application that fetches recent news articles about autocracy and democracy decline, analyzes them with AI, and generates immersive choose-your-own-adventure narratives.

## Overview

This project combines news aggregation with AI-powered narrative analysis to:

1. Fetch recent news articles about autocracy, fascism, and antidemocratic movements
2. Analyze which articles would make compelling interactive fiction
3. Store accepted articles in a SQLite database with analysis run tracking
4. Generate detailed, branching choose-your-own-adventure narratives based on real news events

To come: 5. Store the narratives in a NoSQL DB 6. Provide a user-facing prompt for selecting a story to play 7. Use ElevenLabs APIs to generate voices and sound effects for the narratives.
More details to come.

## Features

- **Smart Incremental Fetching**: Only fetches articles newer than the last analysis run
- **AI Analysis**: Uses OpenAI's GPT-4 to evaluate narrative potential and filter articles
- **URL Validation**: Automatically filters out fake URLs (example.com, removed.com, etc.)
- **Database Storage**: SQLite database to track analysis runs and store accepted articles
- **Narrative Generation**: Creates 2,500-3,000 word interactive stories with 10 decision points
- **Overwrite Protection**: Prevents accidental narrative overwrites with confirmation prompts
- **Template-Based Prompts**: Modular prompt system using external text files
- **Daily Automation**: Built-in cron job support for automated daily processing

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
npm install sqlite3 dotenv node-cron
```

3. Get your API keys:

   - **NewsAPI**: Sign up at [newsapi.org](https://newsapi.org/) for a free API key
   - **OpenAI**: Get your API key from [platform.openai.com](https://platform.openai.com/)

4. Create a `.env` file in the root directory:

```env
NEWS_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

### 1. Run Full Analysis Pipeline

To fetch articles, analyze them, and save to database:

```bash
node main.js
```

This will:

1. Get the timestamp of the most recent analysis run
2. Fetch only articles newer than that timestamp (or past month if first run)
3. Filter out invalid URLs automatically
4. Send articles to OpenAI for curation analysis
5. Store accepted articles in the database with run tracking

### 2. Generate Interactive Narratives

To create a choose-your-own-adventure story from a specific article:

```bash
node generateNarrative.js <articleId>
```

Example:

```bash
node generateNarrative.js 8
```

This will:

1. Load the article from the database
2. Generate a 2,500-3,000 word interactive narrative with 10 decision points
3. Save the narrative to the database
4. Prompt for confirmation if a narrative already exists for that article

### 3. Daily Automated Processing

To run automated daily jobs:

```bash
node dailyJob.js
```

This starts a cron job that runs daily at 6 AM and:

1. Fetches new articles since the last run
2. Curates them with AI
3. Stores accepted articles
4. Generates narratives for all new articles
5. Logs all activities for monitoring

### 4. View Database Contents

Use [DB Browser for SQLite](https://sqlitebrowser.org/) to explore your data:

1. Open DB Browser for SQLite
2. Open `lede_character.db`
3. Browse the `analysis_runs`, `articles`, and `narratives` tables

## Configuration

### Curation Prompt Template

Create a `curation-prompt.txt` file with your AI curation instructions. Example structure:

```text
You are an expert narrative designer analyzing news articles.

Tasks:
1. Reject articles centered on fictional content
2. Reject articles not focused on autocracy or democracy decline
3. Select the best 10 articles for choose-your-own-adventure narratives

Respond with ONLY valid JSON:
{
  "acceptedArticles": [
    {
      "index": 1,
      "title": "Article title",
      "description": "Brief description"
    }
  ]
}

Articles:
{{articles}}
```

### NewsAPI Search Query

The application searches for articles using these keywords:

- autocracy, autocratic, antidemocratic
- fascist, fascism, far-right
- authoritarian, authoritarianism
- dictatorship, totalitarianism
- populism, populist, demagogue
- despotism, despot, tyrant, tyranny

## Database Schema

### analysis_runs

- `id`: Primary key
- `created_at`: ISO 8601 timestamp with Z suffix (UTC)
- `total_articles`: Number of articles analyzed
- `accepted_articles`: Number of articles accepted for narratives

### articles

- `id`: Primary key
- `run_id`: Foreign key to analysis_runs
- `title`, `description`, `url`, `author`, `published_at`, `source`: Article metadata
- `created_at`: ISO 8601 timestamp with Z suffix (UTC)

### narratives

- `id`: Primary key
- `article_id`: Foreign key to articles (unique constraint prevents duplicates)
- `created_at`: ISO 8601 timestamp with Z suffix (UTC)
- `narrative_text`: Full interactive story content

## File Structure

```
lede_character/
├── .env                    # Environment variables (not committed)
├── .gitignore             # Git ignore rules
├── main.js               # Main analysis pipeline
├── helpers.js            # Core utility functions
├── database.js           # Database operations and schema
├── generateNarrative.js  # Narrative generation script
├── dailyJob.js          # Automated daily processing
├── curation-prompt.txt  # AI curation template
├── narrative-prompt.txt # AI narrative generation template
├── lede_character.db    # SQLite database (created automatically)
├── package.json         # Project dependencies
└── README.md            # This file
```

## API Configuration

### NewsAPI Query Parameters

- **Query**: Complex boolean search for autocracy-related terms
- **Date Range**: Incremental from last analysis run timestamp
- **Sort**: By popularity
- **Automatic URL filtering**: Removes example.com, removed.com, etc.

### OpenAI Configuration

- **Model**: `gpt-4-1106-preview`
- **Curation Temperature**: 0.7 (balanced creativity/consistency)
- **Narrative Temperature**: 0.85 (high creativity for storytelling)
- **Max Tokens**: 4,096 (for full narrative generation)

## Environment Variables

| Variable         | Description                                 | Required |
| ---------------- | ------------------------------------------- | -------- |
| `NEWS_API_KEY`   | Your NewsAPI key for fetching articles      | Yes      |
| `OPENAI_API_KEY` | Your OpenAI API key for analysis/narratives | Yes      |

## Narrative Structure

Generated narratives feature:

- **Grounding**: Specific location, time, character identity
- **Length**: 2,500-3,000 words with exactly 10 decision points
- **Structure**: 3-act format with escalating tension
- **Branching**: Multiple paths that reconverge and branch again
- **Endings**: 3-4 complete endings (300+ words each) based on player choices
- **Format**: Second-person narrative ("You are...")

## Cost Considerations

**GPT-4 Turbo Pricing (as of 2025):**

- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- **Typical cost per analysis run**: ~$0.05-0.15 (depends on article count)
- **Typical cost per narrative**: ~$0.13
- **Daily automation estimate**: ~$1-3/day (varies by news volume)

## Monitoring and Logging

The application provides detailed logging:

- Article fetching progress and counts
- AI analysis results and acceptance rates
- Database operations and run tracking
- Narrative generation status
- Error handling with specific failure points

## Error Handling

The application includes comprehensive error handling for:

- Missing environment variables
- API request failures and rate limits
- Database connection issues
- Duplicate narrative prevention
- Invalid article IDs
- Malformed AI responses

## Rate Limits and Best Practices

Be aware of API rate limits:

- **NewsAPI**: 1,000 requests/month (free tier)
- **OpenAI**: Varies by plan and model
- Built-in delays between API calls to avoid rate limiting
- Incremental fetching reduces API usage

## Troubleshooting

### Common Issues

**"Cannot find module 'sqlite3'"**

```bash
npm install sqlite3
```

**"database is locked"**

- Close DB Browser for SQLite before running scripts
- Ensure no other processes are accessing the database

**"Article not found"**

- Check that the article ID exists: `SELECT * FROM articles WHERE id = ?`
- Run `node main.js` first to populate articles

**Short narratives despite prompt requirements**

- Check max_tokens setting (should be 4096)
- Verify narrative-prompt.txt emphasizes length requirements

**Dotenv logging messages**

- Ensure dotenv is only loaded once in each execution path
- Use `{ silent: true }` option consistently

**NewsAPI returns fake URLs**

- This is normal for paywalled content
- The application automatically filters these out

## Development

### Adding New Features

1. **New article sources**: Add to `getRecentArticles()` in helpers.js
2. **Custom curation logic**: Modify `curateArticles()` function
3. **Database changes**: Update schema in database.js
4. **New prompt templates**: Add template files and loading functions

### Testing

```bash
# Test article fetching
node -e "require('./helpers').getRecentArticles().then(console.log)"

# Test database operations
node -e "require('./helpers').getMostRecentAnalysisRunTimestamp().then(console.log)"

# Test narrative generation
node generateNarrative.js <article_id>
```

## Security Notes

- Never commit your `.env` file
- Rotate API keys regularly
- Monitor OpenAI usage to avoid unexpected charges
- Database contains no sensitive personal information
- All timestamps stored in UTC for consistency

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test with both analysis and narrative generation workflows
4. Ensure all environment variables are documented
5. Submit a pull request with clear description

## License

[Add your license information here]

## Future Enhancements

- [ ] Web interface for narrative browsing and management
- [ ] Audio generation integration for voice narratives
- [ ] Multiple news source aggregation (Guardian, Reuters APIs)
- [ ] Narrative rating and feedback system
- [ ] Export to Twine, Ink, or other interactive fiction formats
- [ ] Character illustration generation with DALL-E
- [ ] Advanced analytics dashboard for article trends
- [ ] Webhook integration for real-time article processing
- [ ] Multi-language support for international news sources
