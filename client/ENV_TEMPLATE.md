# Environment Variables Template

Create a `.env` file in the `client/` directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## LLM API Keys

LLM API keys should be stored securely in Supabase Edge Function secrets, NOT in the client .env file:

- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key  
- `GOOGLE_AI_API_KEY` - Your Google AI API key

To set these in Supabase:
```bash
supabase secrets set OPENAI_API_KEY=your_key_here
supabase secrets set ANTHROPIC_API_KEY=your_key_here
supabase secrets set GOOGLE_AI_API_KEY=your_key_here
```

