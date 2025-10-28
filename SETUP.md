# Quick Setup Guide

This guide will get you up and running in under 10 minutes.

## Prerequisites

✅ Node.js 18+ installed
✅ LLM API key (at least one: OpenAI, Anthropic, or Gemini)

## Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be ready (~2 minutes)

### 2. Set Up Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute

### 3. Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the Edge Function
supabase functions deploy run-evaluations

# Set LLM API keys (at least one required)
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set GOOGLE_AI_API_KEY=...
```

### 4. Configure Frontend

1. Create `client/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from Supabase Dashboard → Settings → API

### 5. Install & Run

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` 🎉

## Quick Test

1. **Import Data**: Upload `sample_input.json` from the project root
2. **Create Judge**: 
   - Name: "Test Judge"
   - Model: "gpt-3.5-turbo" (or your preferred model)
   - Prompt: 
   ```
   Evaluate the answer and respond with JSON:
   {"verdict": "pass", "reasoning": "explanation"}
   ```
3. **Assign Judge**: Select the judge for any question
4. **Run Evaluations**: Click "Run AI Judges"
5. **View Results**: Check the Results tab

## Troubleshooting

### "Missing environment variables"
- Make sure `.env` file exists in `client/` directory
- Check that `VITE_` prefix is included

### "No API key for model"
- Set the API key in Supabase Edge Function secrets
- Restart the Edge Function after setting secrets

### "Failed to call LLM API"
- Verify your API key is valid
- Check you have credits/quota remaining
- Try a different model

### Edge Function not found
- Ensure you've deployed: `supabase functions deploy run-evaluations`
- Check function is listed in Supabase Dashboard → Edge Functions

## Production Deployment

### Deploy Frontend

**Vercel** (Recommended):
```bash
cd client
vercel
```

**Netlify**:
```bash
cd client
netlify deploy --prod
```

Update environment variables in your hosting provider's dashboard.

### Update CORS

In Supabase Dashboard → Settings → API → CORS:
- Add your production URL
- Keep `http://localhost:5173` for local development

## Support

For issues, check:
1. Browser console for errors
2. Supabase Edge Function logs (Dashboard → Edge Functions → run-evaluations → Logs)
3. Network tab to see API calls

## Next Steps

- Create custom judges with domain-specific prompts
- Import your own submission data
- Experiment with different LLM models
- Adjust system prompts to refine evaluation criteria

