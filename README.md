# Lede Character

This is a WIP; expect the README and codebase to be updated frequently.

## Overview

An AI-powered immersive journalism platform that transforms real news about democracy's decline into interactive, audio-driven choose-your-own-adventure narratives. Using OpenAI GPT-4 for intelligent news curation and narrative generation, with a graph-based story structure designed for future audio integration via ElevenLabs APIs.

Key Features:

- AI-Powered Pipeline: GPT-4 curates news and generates branching narratives
- Graph-Based Story Engine: Sophisticated node-and-choice structure for complex branching
- Interactive Menu System: Browse and select stories from an intuitive CLI interface
- Terminal-Based Gameplay: Full choose-your-own-adventure experience with branching narratives
- Real News Foundation: Stories grounded in actual democracy/autocracy reporting
- Scalable Architecture: Built for future audio synthesis and voice interaction

### Current Implementation:

1. News Curation: Fetch and intelligently filter articles about autocracy and democratic decline
2. Story Generation: Transform selected articles into branching interactive narratives
3. Graph Storage: Save stories as interconnected nodes and choices in SQLite database
4. Interactive Story Browser: Menu-driven interface to select and play available narratives
5. Complete MVP: End-to-end pipeline from news article to playable interactive story on the command line

### Planned Features:

- **Daily Automation**: Built-in cron job support for automated daily processing
- **Audio Integration**: Use ElevenLabs APIs to generate professional voice narration and sound effects
- **Web Interface**: Browser-based story player with enhanced UX
- **Session Management**: Track user progress, choices, and story completion
- **Cost Optimization**: Smart caching and cost tracking for API usage

The end goal is a fully immersive audio experience where users can select from curated news-based narratives, make choices at decision points, and experience branching storylines with professional voice acting and atmospheric sound design.

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
npm install sqlite3 dotenv
```

3. Get your API keys:

   - **NewsAPI**: Sign up at [newsapi.org](https://newsapi.org/) for a free API key
   - **OpenAI**: Get your API key from [platform.openai.com](https://platform.openai.com/)

4. Create a `.env` file in the root directory:

```env
NEWS_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

5. Initialize the DB:
   This will happen on the first run.

## Usage

### Interactive Story Browser (Recommended)

```bash
# Browse and play available narratives with menu selection
node chooseAndPlay.js
```

This launches an interactive menu where you can:

- View all available narratives with descriptions
- See which news articles each story is based on
- Select stories by number for immediate playback
- Return to the menu after completing stories
- Play multiple stories in one session

### Full MVP Demo

```bash
# Complete pipeline: fetch → curate → generate → play
node mvpDemo.js
```

### Step by Step Usage

1. **Fetch and Curate Articles**

```bash
node main.js
```

- Fetches recent articles about democracy/autocracy
- Uses GPT-4 to curate the most narrative-worthy stories
- Saves results to SQLite database

2. **Generate Interactive Narratives**

```bash
node generateNarrative.js <articleId>
# Example: node generateNarrative.js 1
```

- Creates a branching choose-your-own-adventure story
- Uses graph structure with story nodes and choice connections
- Stores narrative as interconnected database entities

3. **Play Specific Story by Article ID**

```bash
node playNarrative.js <articleId>
# Example: node playNarrative.js 1
```

- Interactive terminal-based story experience
- Navigate through branching narrative with numbered choices
- Multiple endings based on user decisions

### Batch Narrative Generation

```bash
# Generate narratives for all articles without existing narratives
node generateAllNarratives.js

# Skip confirmation prompt for large batches
node generateAllNarratives.js --confirm
```

**Features:**

- **Smart Article Detection**: Finds articles without existing narratives using LEFT JOIN queries
- **Cost Estimation**: Shows estimated OpenAI costs before proceeding with batch operations
- **Rate Limit Handling**: 2-second delays between requests to respect OpenAI API limits
- **Progress Tracking**: Shows current progress (e.g., [3/10]) and reports success/failure rates
- **Error Resilience**: Continues processing if individual articles fail, with detailed reporting
- **Batch Confirmation**: Prompts for confirmation on expensive operations (5+ narratives)

This is especially useful after running `node main.js` to quickly generate interactive stories for all your curated articles.

## Database

The application uses SQLite to store analysis runs, articles, and generated narratives with automatic schema creation.

## File Structure

```
lede_character/
├── .env                     # Environment variables (not committed)
├── .gitignore              # Git ignore rules
├── chooseAndPlay.js        # Interactive story browser and player
├── curation-prompt.txt     # AI curation template
├── database.js             # Database operations and schema
├── generateNarrative.js    # Single narrative generation script
├── generateAllNarratives.js # Batch narrative generation for all articles
├── helpers.js              # Core utility functions
├── lede_character.db       # SQLite database (created automatically)
├── LICENSE                 # MIT License
├── main.js                 # Main analysis pipeline
├── mvpDemo.js              # Complete end-to-end demo script
├── narrativeParser.js      # Graph structure parsing for AI responses
├── narrative-prompt.txt    # AI narrative generation template
├── package.json            # Project dependencies
├── playNarrative.js        # Direct story playback by article ID
├── README.md               # This file
├── resetDatabase.js        # Database reset utility with confirmation prompts
└── testOpenAI.js           # API connectivity debugging tool
```

## Current Features

### ✅ Completed MVP Features

- **Complete MVP Pipeline**: End-to-end news → interactive story generation
- **Interactive Story Browser**: Menu-driven interface to select and play narratives
- **Graph-Based Story Structure**: Sophisticated node-and-choice database architecture
- **Terminal-Based Gameplay**: Full choose-your-own-adventure experience
- **Smart Article Curation**: GPT-4 intelligently filters articles for narrative potential
- **Real-time Story Navigation**: Users make choices and experience branching paths
- **Database Persistence**: Stories saved as interconnected graph structures
- **Batch Processing**: Generate narratives for all curated articles at once
- **Comprehensive Error Handling**: API failures, database issues, and user input validation
- **Debug Tools**: API testing utilities and database reset functionality

### 🔄 In Development

- **Audio Synthesis Integration**: ElevenLabs API for immersive audio narratives
- **Voice Choice Selection**: Replace keyboard input with speech recognition
- **Web Interface**: Browser-based story player with enhanced UX
- **Advanced Story Analytics**: Choice popularity, path analysis, user engagement metrics

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
- Interactive story session tracking
- Error handling with specific failure points

## Error Handling

The application includes comprehensive error handling for:

- Missing environment variables
- API request failures and rate limits
- Database connection issues
- Duplicate narrative prevention
- Invalid article IDs and narrative selection
- Malformed AI responses
- User input validation in interactive menus

## Troubleshooting

### Common Issues

**"database is locked"**

- Close DB Browser for SQLite before running scripts
- Ensure no other processes are accessing the database

**"No narratives available" in chooseAndPlay.js**

- Run `node main.js` to fetch and curate articles
- Run `node generateAllNarratives.js` to create narratives
- Check database: `SELECT COUNT(*) FROM narratives`

**"Article not found" in playNarrative.js**

- Check that the article ID exists: `SELECT * FROM articles WHERE id = ?`
- Use `node chooseAndPlay.js` instead for easier story selection

**Double input or readline issues**

- Only one Node.js process should access the terminal at a time
- Use `node chooseAndPlay.js` for the best interactive experience

**Short narratives despite prompt requirements**

- Check max_tokens setting (should be 4096)
- Verify narrative-prompt.txt emphasizes length requirements

**NewsAPI returns fake URLs**

- This is normal for paywalled content
- The application automatically filters these out

### Rate Limits

Be aware of the following API rate limits with the current implementation:

- **NewsAPI**: 1,000 requests/month (free tier)
- **OpenAI**: Varies by plan and model

## Development

### Testing

```bash
# Test article fetching
node -e "require('./helpers').getRecentArticles().then(console.log)"

# Test database operations
node -e "require('./helpers').getMostRecentAnalysisRunTimestamp().then(console.log)"

# Test narrative generation
node generateNarrative.js <article_id>

# Test interactive experience
node chooseAndPlay.js
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Future Development Roadmap

Based on the current codebase, here's a comprehensive checklist of remaining features to implement:

### Phase 1: Core Pipeline Completion

- [x] **Add `saveAnalysisRun` function** to database.js for storing analysis results
- [x] **Implement narrative generation workflow** with single and batch processing
- [x] **Add error handling and retry logic** for API failures
- [x] **Implement duplicate narrative prevention** with user confirmation prompts
- [x] **Add batch processing capabilities** with cost estimation and progress tracking
- [x] **Build command-line interface** for selecting narratives with menu system
- [ ] **Create daily automation script** with cron job scheduling
- [ ] **Add logging system** for monitoring pipeline runs

### Phase 2: Enhanced User Experience

- [x] **Interactive story browser** with narrative descriptions and metadata
- [x] **User session management** for playing multiple stories
- [x] **Branching logic navigation** through story decision points
- [ ] **User progress persistence** between sessions
- [ ] **Narrative completion tracking** and statistics
- [ ] **Story replay functionality** with different choice paths

### Phase 3: Audio Integration (ElevenLabs)

- [ ] **Research ElevenLabs API** and pricing structure
- [ ] **Set up ElevenLabs account** and obtain API credentials
- [ ] **Design audio generation strategy**:
  - [ ] Generate entire narrative upfront vs. on-demand
  - [ ] Segment narratives for optimal audio chunks
  - [ ] Handle choice prompts and branching audio
- [ ] **Implement audio synthesis pipeline**
- [ ] **Add sound effects integration** for immersive experience
- [ ] **Create audio file storage system** (local files vs. cloud storage)
- [ ] **Build audio playback interface**

### Phase 4: Cost Management & Optimization

- [ ] **Add API cost tracking tables** to database schema
- [ ] **Implement cost logging** for OpenAI and ElevenLabs calls
- [ ] **Create budget monitoring** and alert system
- [ ] **Add audio caching logic** to prevent duplicate generation
- [ ] **Build cost analytics dashboard** for spending insights
- [ ] **Implement usage optimization** (batch processing, smart caching)

### Phase 5: Data Management & Quality

- [ ] **Add data validation** for article content quality
- [ ] **Implement narrative quality scoring** and feedback
- [ ] **Create database backup and migration scripts**
- [ ] **Add article source diversification** beyond NewsAPI
- [ ] **Build content moderation** for inappropriate narratives
- [ ] **Add narrative versioning** for iterative improvements

### Phase 6: Advanced Features

- [ ] **Web-based interface** for better user experience
- [ ] **Multi-user support** with user accounts and preferences
- [ ] **Narrative sharing and rating system**
- [ ] **Advanced analytics** on user choices and story paths
- [ ] **Integration with other story formats** (Twine, Ink, etc.)
- [ ] **Mobile app development** for audio narrative consumption
- [ ] **AI voice cloning** for consistent character voices
- [ ] **Dynamic story adaptation** based on user choices over time

### Phase 7: Production & Deployment

- [ ] **Environment configuration** (dev/staging/production)
- [ ] **Cloud deployment setup** (AWS/GCP/Azure)
- [ ] **CI/CD pipeline** for automated testing and deployment
- [ ] **Performance monitoring** and error tracking
- [ ] **Security hardening** and API key management
- [ ] **Documentation completion** for contributors
- [ ] **User onboarding and tutorial system**

### Phase 8: Business & Scale

- [ ] **Usage analytics** and user behavior tracking
- [ ] **Content recommendation engine** based on user preferences
- [ ] **Subscription or monetization model**
- [ ] **Content partnerships** with news organizations
- [ ] **Accessibility features** for users with disabilities
- [ ] **Internationalization** for multiple languages
- [ ] **Performance optimization** for large-scale usage

### Technical Debt & Maintenance

- [ ] **Add comprehensive unit tests** for all functions
- [ ] **Implement integration tests** for full pipeline
- [ ] **Add TypeScript** for better type safety
- [ ] **Refactor code organization** into proper modules
- [ ] **Add configuration management** for different environments
- [ ] **Implement proper logging framework** (Winston, etc.)
- [ ] **Add health checks** and monitoring endpoints
