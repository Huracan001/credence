# ElizaOS Integration

This project integrates ElizaOS for generating AI-powered market insights.

## Setup

### Environment Variables

Add the following to your `.env.local` file:

```env
# ElizaOS Configuration
# Use one of the following API keys (priority: Google > Anthropic > OpenAI)

# Google Gemini (Recommended)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
GOOGLE_SMALL_MODEL=gemini-2.0-flash-001           # Optional: Default gemini-2.0-flash-001
GOOGLE_LARGE_MODEL=gemini-2.5-pro-preview-03-25   # Optional: Default gemini-2.5-pro-preview-03-25

# OR Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# OR OpenAI
OPENAI_API_KEY=your_openai_api_key_here
```

### Available Google Gemini Models

- `gemini-2.0-flash-001` (default small model)
- `gemini-2.5-pro-preview-03-25` (default large model)
- `gemini-1.5-flash`
- `gemini-1.5-pro`
- `gemini-pro`

### How It Works

1. **ElizaOS Agent**: Uses OpenAI or Anthropic API with ElizaOS-style prompts to generate market insights
2. **Fallback**: If ElizaOS fails or no API key is provided, falls back to deterministic template-based insights
3. **Integration**: Automatically integrates with enriched context (news, Twitter, web search) when available

### Features

- AI-powered market explanations using ElizaOS patterns
- Automatic fallback to deterministic insights
- Integration with news, Twitter, and web search context
- Cached insights for performance

### Usage

The ElizaOS agent is automatically used when generating insights. No manual configuration needed beyond setting the API key.
