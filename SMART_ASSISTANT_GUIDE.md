# Smart BeSimple Assistant - Context-Aware AI

## 🧠 What Makes It Smart?

The BeSimple Assistant now has **full context** about your data! It can answer questions about:

- ✅ **Your Submissions**: How many you have, when they were uploaded
- ✅ **Your Evaluations**: Results, pass/fail rates, recent evaluations
- ✅ **Your Judges**: Active judges, their models, configurations
- ✅ **Your Statistics**: Counts, percentages, trends
- ✅ **Your Data**: Specific questions, answers, verdicts

## 🎯 Example Questions You Can Ask

### Data Questions
- "How many submissions do I have?"
- "What are my evaluation results?"
- "How many judges do I have?"
- "What's my pass rate?"
- "Show me my recent evaluations"

### Analysis Questions
- "Which judge performed best?"
- "What's my evaluation success rate?"
- "How many evaluations failed?"
- "What are my active judges?"

### Platform Questions
- "How do I upload submissions?"
- "What is a judge assignment?"
- "How do I run evaluations?"
- "What does calibration do?"

## 🔧 How It Works

1. **Authentication**: Uses your login session to identify you
2. **Data Query**: Queries your database in real-time
3. **Context Building**: Gathers statistics about your data
4. **AI Response**: LLM uses this context to answer your questions

## 📊 What Data It Has Access To

- Submission count and details
- Question count
- Judge count and configurations
- Evaluation count and results
- Verdict breakdowns (pass/fail/inconclusive)
- Recent evaluation history
- Judge assignments
- Golden set data
- Calibration runs

## 🔒 Privacy & Security

- ✅ Only sees **your** data (user isolation via RLS)
- ✅ Uses your authentication token
- ✅ Queries are filtered by `user_id`
- ✅ No data is shared between users

## 🚀 Deploy Updated Function

After updating the code, redeploy:

```bash
supabase functions deploy assistant
```

The assistant will now be context-aware and can answer questions about your specific data!

## 💡 Tips

- Ask specific questions: "How many submissions do I have?" works better than "tell me about data"
- Use natural language: "What's my pass rate?" is fine
- The assistant remembers conversation context (last 10 messages)

