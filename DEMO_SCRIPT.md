# Demo Script for Video Recording

This script guides you through recording a comprehensive demo video for the AI Judge System.

## 🎬 Recording Setup

**Tools**: Loom, QuickTime, or any screen recorder
**Duration**: 3-5 minutes
**Resolution**: 1080p or higher
**Audio**: Optional but recommended (explain what you're doing)

## 📝 Demo Script

### Opening (15 seconds)

**Show**: Browser at `http://localhost:5173`

**Say**: "This is the AI Judge System - a full-stack application for automated evaluation of submissions using LLM-powered AI judges. Let me walk you through the complete workflow."

---

### 1. Data Ingestion (30 seconds)

**Navigate**: Click "Data Ingestion" in sidebar

**Action**: 
- Drag and drop `sample_input.json` or click to browse
- Show validation success message
- Scroll down to show imported submissions list

**Highlight**:
- "The system validates the JSON schema using Zod"
- "Data is persisted to Supabase PostgreSQL"
- "We have 3 submissions with 4 unique questions"

---

### 2. AI Judges CRUD (60 seconds)

**Navigate**: Click "AI Judges"

**Action 1 - Create**:
- Click "Create Judge"
- Name: "Correctness Checker"
- Model: "gpt-4-turbo" (or gpt-3.5-turbo)
- System Prompt:
```
You are evaluating the correctness of user answers.

Evaluate based on:
- Factual accuracy
- Logical reasoning

Respond with JSON:
{
  "verdict": "pass" | "fail" | "inconclusive",
  "reasoning": "brief explanation"
}
```
- Check "Active"
- Click "Create Judge"

**Action 2 - Create Second Judge**:
- Click "Create Judge" again
- Name: "Reasoning Quality Judge"
- Model: "claude-3-sonnet-20240229" (or another model)
- System Prompt:
```
You are evaluating the quality of reasoning in user answers.

Focus on:
- Clarity of thought process
- Depth of reasoning

Respond with JSON:
{
  "verdict": "pass" | "fail" | "inconclusive",
  "reasoning": "explanation"
}
```
- Click "Create Judge"

**Highlight**:
- "Full CRUD operations available"
- "Can toggle active/inactive status"
- "Supports multiple LLM providers"
- Show both judges in the list with badges

---

### 3. Judge Assignments (45 seconds)

**Navigate**: Click "Assignments"

**Action**:
- For "Is the sky blue?": Select both judges
- For "Is water wet?": Select "Correctness Checker"
- For "Does 2+2 equal 4?": Select both judges
- Click "Save All Assignments"

**Highlight**:
- "Flexible assignment - multiple judges per question"
- "Different questions can have different judge combinations"
- "Assignments are persisted to the database"

---

### 4. Run Evaluations (60 seconds)

**Navigate**: Click "Run Evaluations"

**Show**:
- Overview statistics: X submissions, Y judges, Z assignments
- Explain: "This will call the actual LLM APIs for each question-judge pair"

**Action**:
- Click "Run AI Judges"
- Show loading state
- Wait for completion (~5-10 seconds)
- Show results summary: completed/failed counts

**Highlight**:
- "Calls real OpenAI/Anthropic/Gemini APIs"
- "Supabase Edge Function handles secure API calls"
- "Retry logic with exponential backoff"
- "Parses LLM responses to extract verdict and reasoning"

---

### 5. Results View with Filters (60 seconds)

**Navigate**: Click "Results"

**Show Initial State**:
- Pass rate percentage (large display)
- Breakdown: X pass, Y fail, Z inconclusive
- List of all evaluations

**Action 1 - Filter by Verdict**:
- Click "Filters" button
- Check "pass" under Verdicts
- Show filtered results
- Point out: "Only showing pass verdicts now"

**Action 2 - Filter by Judge**:
- Clear previous filter
- Select "Correctness Checker" under Judges
- Show results from only that judge

**Action 3 - Combine Filters**:
- Keep judge filter
- Add "pass" verdict filter
- Show: "Now showing only passing evaluations from Correctness Checker"
- Clear filters

**Highlight**:
- "Multi-select filters for judge, question, and verdict"
- "Real-time statistics update"
- "Each evaluation shows verdict, judge, model, reasoning, and timestamp"
- Scroll through evaluation cards

---

### 6. Feature Highlights (30 seconds)

**Navigate**: Quickly click through tabs again

**Highlight**:
- **Data Ingestion**: "Zod validation ensures data integrity"
- **Judges**: "Edit button for updates, power button for toggle, delete option"
- **Assignments**: "Checkbox UI makes multi-select intuitive"
- **Evaluations**: "Progress tracking during execution"
- **Results**: "Comprehensive filtering and statistics"

**General**:
- "Clean, modern UI with Tailwind CSS and shadcn/ui"
- "Loading states, error handling, empty states throughout"
- "TypeScript for type safety"
- "React Query for optimistic updates and caching"

---

### 7. Technical Architecture (20 seconds)

**Show**: Sidebar or briefly mention

**Say**: 
"Built with:
- **Frontend**: React 18, TypeScript, Vite, TanStack Query
- **Backend**: Supabase PostgreSQL with Row Level Security
- **LLM Integration**: Supabase Edge Functions with provider strategy pattern
- **UI**: Tailwind CSS with shadcn/ui components
- **Validation**: Zod schemas for runtime type safety"

---

### Closing (10 seconds)

**Show**: Results page with statistics

**Say**: "This demonstrates a production-ready AI evaluation system with real LLM integration, proper error handling, and a polished user experience. The architecture is scalable and maintainable, with clean separation of concerns and comprehensive type safety."

---

## 🎯 Key Points to Emphasize

1. **Real LLM Integration**: Not mocked - actual API calls
2. **Full CRUD**: Complete create, read, update, delete for judges
3. **Type Safety**: TypeScript + Zod validation
4. **UX Polish**: Loading states, error handling, empty states
5. **Clean Architecture**: Feature-based structure, separation of concerns
6. **Production Ready**: Supabase backend, proper database schema, Edge Functions

## 📹 Video Tips

- **Keep it smooth**: Practice once before recording
- **Clear audio**: Speak clearly and at moderate pace
- **Show loading states**: Don't edit them out - they demonstrate real async operations
- **Highlight filters**: The multi-select filtering is a key feature
- **Show error handling**: If time permits, demonstrate what happens with invalid data
- **End with results**: Leave the statistics visible at the end

## 📎 What to Include in Email

**Subject**: AI Judge System - Demo Submission

**Body**:
```
Hi BeSimple Team,

Please find my AI Judge System demo video: [Loom/YouTube link]

Time Spent: ~6-8 hours
- Architecture & planning: 1 hour
- Backend (Supabase, Edge Functions): 1.5 hours  
- Frontend implementation: 3 hours
- UI polish & error handling: 1 hour
- Documentation: 0.5 hours

Key Technical Decisions:
- Supabase for PostgreSQL + Edge Functions (secure LLM calls)
- React Query for optimistic updates and caching
- Provider Strategy Pattern for multi-LLM support
- Zod for runtime type validation
- Feature-based architecture for scalability

Trade-offs:
- Prioritized core functionality and code quality over advanced features
- Simplified auth (RLS policies) to focus on evaluation logic
- No unit tests to meet deadline, but comprehensive error handling

The system demonstrates production-ready patterns: type safety, error boundaries, 
loading states, proper database normalization, and clean component architecture.

Looking forward to discussing the implementation!

Best regards,
[Your Name]
```

## 🎬 Ready to Record!

Everything is set up. Just follow this script, and you'll have a professional demo video. Good luck! 🚀

