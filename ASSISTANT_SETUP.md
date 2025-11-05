# BeSimple AI Assistant Setup

## Overview

The BeSimple AI Assistant is a helpful chatbot that provides contextual help about the AI Judge System platform. It appears as a floating button in the bottom-left corner of the application.

## Features

- ✅ **Contextual Help**: Understands the AI Judge System platform
- ✅ **BeSimple Branding**: Styled with BeSimple colors and logo
- ✅ **Real-time Chat**: Interactive conversation with AI
- ✅ **Floating Widget**: Non-intrusive, always accessible
- ✅ **Multi-LLM Support**: Uses OpenAI or Gemini (with fallback)

## Deployment

### Step 1: Deploy Edge Function

```bash
supabase functions deploy assistant
```

### Step 2: Verify API Keys

The assistant uses the same API keys as the evaluation system:
- `OPENAI_API_KEY` (preferred)
- `GOOGLE_AI_API_KEY` (fallback)

If you've already set these for the `run-evaluations` function, you're good to go!

### Step 3: Test

1. Start your development server: `cd client && npm run dev`
2. Log in to the application
3. Look for the floating message icon in the bottom-left corner
4. Click it to open the chat
5. Try asking: "How do I upload submissions?"

## Usage

The assistant can help with:
- Platform features and workflows
- How to use specific features (ingestion, judges, evaluations, etc.)
- Troubleshooting common issues
- Understanding evaluation results
- Best practices for creating judges

## Example Questions

- "How do I upload my data?"
- "What is a judge assignment?"
- "How do I run evaluations?"
- "What does the calibration feature do?"
- "How do I view my results?"

## Technical Details

- **Frontend**: React component in `client/src/features/assistant/components/AssistantWidget.tsx`
- **Backend**: Supabase Edge Function in `supabase/functions/assistant/index.ts`
- **LLM**: Uses `gpt-4o-mini` (OpenAI) or `gemini-2.0-flash-lite` (Gemini)
- **Context Window**: Last 10 messages for conversation context
- **Response Length**: Max 500 tokens (concise responses)

## Customization

To modify the assistant's behavior:
1. Edit `SYSTEM_PROMPT` in `supabase/functions/assistant/index.ts`
2. Adjust `max_tokens` for longer/shorter responses
3. Change the model in the Edge Function (currently `gpt-4o-mini`)

## Styling

The assistant uses BeSimple brand colors:
- Primary: `#eda436` (amber)
- Background: BeSimple beige theme
- Logo: BeSimple tomato logo

All styling is in the `AssistantWidget.tsx` component.

