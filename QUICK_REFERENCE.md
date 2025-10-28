# Quick Reference Card

## 🚀 Getting Started (3 Commands)

```bash
cd client
npm install
npm run dev
```

Visit: `http://localhost:5173`

## 🔑 Required Before Running

### 1. Create `.env` in `client/` folder:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Set up Supabase:
- Create project at [supabase.com](https://supabase.com)
- Run `supabase/migrations/001_initial_schema.sql` in SQL Editor
- Deploy Edge Function: `supabase functions deploy run-evaluations`
- Set API keys: `supabase secrets set OPENAI_API_KEY=sk-...`

## 📂 Project Structure

```
besimple-oa/
├── client/src/
│   ├── features/          # 5 main features
│   │   ├── ingestion/     # Upload JSON
│   │   ├── judges/        # CRUD judges
│   │   ├── assignments/   # Assign judges
│   │   ├── evaluations/   # Run evaluations
│   │   └── results/       # View results
│   ├── shared/            # Reusable components
│   ├── api/               # Supabase client
│   └── App.tsx            # Main app
├── supabase/
│   ├── migrations/        # Database schema
│   └── functions/         # Edge Functions
├── sample_input.json      # Test data
└── README.md              # Full documentation
```

## 🎯 User Flow

1. **Ingest** → Upload `sample_input.json`
2. **Judges** → Create 2-3 AI judges with prompts
3. **Assignments** → Assign judges to questions
4. **Evaluate** → Click "Run AI Judges"
5. **Results** → View with filters and statistics

## 📊 Key Files

| File | Purpose |
|------|---------|
| `README.md` | Full documentation |
| `SETUP.md` | Quick setup guide |
| `ARCHITECTURE.md` | Architecture decisions |
| `DEMO_SCRIPT.md` | Video recording script |
| `PROJECT_SUMMARY.md` | Completion status |
| `sample_input.json` | Test data |

## 🔧 Common Commands

```bash
# Install dependencies
cd client && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy Edge Function
supabase functions deploy run-evaluations

# Set Edge Function secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set GOOGLE_AI_API_KEY=...

# View Edge Function logs
supabase functions logs run-evaluations
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing environment variables" | Create `client/.env` with VITE_ prefixed vars |
| "No API key for model" | Set keys in Supabase Edge Function secrets |
| "Failed to call LLM API" | Verify API key validity and credits |
| Edge Function not found | Run `supabase functions deploy run-evaluations` |
| Database error | Re-run migration SQL script |

## 📝 Sample System Prompt

```
You are an AI judge evaluating user submissions.

Evaluate based on:
- Correctness
- Reasoning quality
- Clarity

Respond with JSON:
{
  "verdict": "pass" | "fail" | "inconclusive",
  "reasoning": "brief explanation"
}
```

## 🌐 Important URLs

- **Supabase**: https://supabase.com
- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **Anthropic API Keys**: https://console.anthropic.com/
- **Google AI API Keys**: https://makersuite.google.com/app/apikey

## 📹 Recording Demo

Follow `DEMO_SCRIPT.md` for step-by-step video recording guide.

**Duration**: 3-5 minutes
**Content**: Import → Create Judges → Assign → Run → Results → Filters

## 🎯 What Makes This Special

✅ Real LLM API integration (not mocked)
✅ Full CRUD with optimistic updates
✅ Multi-provider support (OpenAI/Anthropic/Gemini)
✅ Production-grade architecture
✅ Comprehensive type safety
✅ Professional UI/UX
✅ Complete documentation

## 🚀 Ready to Demo!

Everything is built and documented. Just:
1. Set up Supabase
2. Add API keys
3. Run `npm run dev`
4. Record video following `DEMO_SCRIPT.md`
5. Submit to hiring@besimple.ai

**Good luck!** 🎉

