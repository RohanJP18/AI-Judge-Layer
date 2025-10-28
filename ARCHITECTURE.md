# AI Judge System - Elite Architecture Design

## System Architecture Philosophy

This document outlines architectural decisions optimized for **scalability, maintainability, type-safety, and performance** from an elite system design perspective.

---

## 1. Backend Architecture Decision

### Choice: **Supabase (PostgreSQL + Edge Functions)**

#### Reasoning:
- **PostgreSQL Power**: ACID compliance, complex queries, JSON support, full-text search
- **TypeScript-First SDK**: Auto-generated types from schema, compile-time safety
- **Real-time Subscriptions**: WebSocket support for live evaluation updates
- **Row-Level Security (RLS)**: Database-enforced authorization (future-proof for multi-tenancy)
- **Edge Functions**: Serverless Deno runtime for secure LLM API calls (no exposed keys)
- **Built-in Auth**: Ready for future user management
- **Cost**: Free tier sufficient for demo, predictable scaling

#### Alternatives Rejected:
- **Firebase**: Less SQL-like, weaker TypeScript support, NoSQL limitations for complex queries
- **SQLite**: Requires separate backend server, lacks real-time features, more operational overhead
- **Custom Node/Express + Postgres**: More control but significantly more boilerplate and setup time

---

## 2. Database Schema Design

### Normalized Relational Design

```sql
-- Core entities with proper normalization
submissions (
  id UUID PRIMARY KEY,
  queue_id TEXT NOT NULL,
  labeling_task_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  raw_json JSONB NOT NULL,  -- Store original for auditability
  INDEX idx_queue_id (queue_id),
  INDEX idx_created_at (created_at)
)

questions (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,  -- Original template ID
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_choice TEXT,
  answer_reasoning TEXT,
  rev INTEGER NOT NULL,
  UNIQUE(submission_id, question_id),
  INDEX idx_submission_id (submission_id)
)

judges (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model_name TEXT NOT NULL,  -- e.g., "gpt-4-turbo", "claude-3-opus"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_active (is_active)
)

judge_assignments (
  id UUID PRIMARY KEY,
  question_id TEXT NOT NULL,  -- Template ID, not instance
  judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, judge_id),
  INDEX idx_question_id (question_id),
  INDEX idx_judge_id (judge_id)
)

evaluations (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('pass', 'fail', 'inconclusive')),
  reasoning TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  error TEXT,  -- Store errors for debugging
  model_name TEXT NOT NULL,  -- Snapshot at evaluation time
  INDEX idx_verdict (verdict),
  INDEX idx_judge_id (judge_id),
  INDEX idx_question_id (question_id),
  INDEX idx_created_at (created_at)
)
```

#### Design Principles:
1. **Normalization**: Avoid duplication, single source of truth
2. **Foreign Keys**: Referential integrity at DB level
3. **Cascade Deletes**: Automatic cleanup of dependent records
4. **Indexes**: Optimized for filter queries in Results view
5. **JSONB for Raw Data**: Preserve original JSON for auditability without forcing structure
6. **Timestamps**: Track creation/updates for auditing
7. **Check Constraints**: Enforce valid verdict values at DB level
8. **UUID Primary Keys**: Distributed-system-friendly, non-sequential for security

---

## 3. Frontend State Management

### Choice: **TanStack Query (React Query) + Zustand**

#### React Query for Server State:
- **Automatic Caching**: Reduces redundant API calls
- **Background Refetching**: Keep data fresh
- **Optimistic Updates**: Instant UI feedback for mutations
- **Request Deduplication**: Multiple components requesting same data = 1 network call
- **Built-in Loading/Error States**: Eliminates boilerplate
- **Infinite Queries**: Efficient pagination for large datasets

#### Zustand for Client State:
- **Minimal Global State**: API keys, UI preferences, filters
- **TypeScript-First**: Excellent type inference
- **No Boilerplate**: Unlike Redux
- **DevTools Support**: Debugging capability

#### Alternatives Rejected:
- **Redux**: Too much boilerplate for this scope
- **Context + useState**: Performance issues with frequent updates, no caching
- **SWR**: Good but React Query has more features (mutations, devtools)

---

## 4. LLM Integration Architecture

### Choice: **Supabase Edge Functions + Provider Strategy Pattern**

#### Architecture:
```
Client → Edge Function (Secure) → LLM Provider APIs
                ↓
        Rate Limiting & Retry Logic
                ↓
        Response Parsing & Validation
                ↓
        Store in Supabase DB
```

#### Key Design Patterns:

**1. Strategy Pattern for Providers:**
```typescript
interface LLMProvider {
  call(prompt: string, config: LLMConfig): Promise<LLMResponse>
  parseVerdict(response: string): Verdict
}

class OpenAIProvider implements LLMProvider { }
class AnthropicProvider implements LLMProvider { }
class GeminiProvider implements LLMProvider { }
```

**2. Circuit Breaker Pattern:**
- Prevent cascading failures from LLM API outages
- Fail fast after N consecutive errors

**3. Retry with Exponential Backoff:**
- Handle transient failures gracefully
- Max 3 retries with 2^n second delays

**4. Parallel Processing with Rate Limiting:**
- Process multiple evaluations concurrently
- Respect API rate limits (e.g., 100 req/min for OpenAI)
- Use p-queue library for concurrency control

**5. Robust Error Handling:**
```typescript
try {
  result = await llmProvider.call()
} catch (error) {
  if (isRateLimitError(error)) {
    await exponentialBackoff()
    retry()
  } else if (isTimeoutError(error)) {
    verdict = 'inconclusive'
    reasoning = 'LLM timeout'
  } else {
    log(error)
    throw
  }
}
```

#### Security:
- **API Keys in Edge Functions**: Never exposed to client
- **Environment Variables**: Secure storage in Supabase
- **CORS Policies**: Restrict to localhost during dev

---

## 5. Type Safety Strategy

### Choice: **Zod + Generated Supabase Types + Strict TypeScript**

#### Type Safety Layers:
1. **Compile-Time (TypeScript)**:
   ```typescript
   // tsconfig.json
   {
     "strict": true,
     "noUncheckedIndexedAccess": true,
     "noImplicitAny": true,
     "strictNullChecks": true
   }
   ```

2. **Runtime Validation (Zod)**:
   ```typescript
   const SubmissionSchema = z.object({
     id: z.string(),
     queueId: z.string(),
     questions: z.array(QuestionSchema),
     answers: z.record(z.string(), AnswerSchema)
   })
   
   // Validation at API boundaries
   const validated = SubmissionSchema.parse(uploadedJson)
   ```

3. **Database Types (Supabase CLI)**:
   ```bash
   supabase gen types typescript --local > src/types/database.ts
   ```
   Auto-generated from actual schema = zero drift

4. **API Response Types**:
   ```typescript
   type ApiResponse<T> = 
     | { success: true; data: T }
     | { success: false; error: string }
   ```

#### Benefits:
- **Catch Errors Early**: Before runtime
- **Refactoring Confidence**: IDE finds all usages
- **Self-Documenting**: Types serve as documentation
- **Validation**: Zod catches malformed data at boundaries

---

## 6. Frontend Architecture

### Feature-Based Module Structure

```
src/
├── features/
│   ├── ingestion/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── types.ts
│   ├── judges/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── types.ts
│   ├── assignments/
│   ├── evaluations/
│   └── results/
├── shared/
│   ├── components/  # Reusable UI components
│   ├── hooks/       # Generic hooks
│   ├── lib/         # Utilities
│   └── types/       # Shared types
├── api/
│   └── supabase.ts  # Client instance
└── App.tsx
```

#### Principles:
- **Feature Colocation**: Related code stays together
- **Separation of Concerns**: Components don't fetch data directly
- **Custom Hooks**: Encapsulate business logic
- **Atomic Components**: Small, composable, testable

---

## 7. UI/UX Architecture

### Choice: **shadcn/ui + Tailwind CSS + Radix Primitives**

#### Reasoning:
- **shadcn/ui**: Copy-paste components with full customization (not a dependency)
- **Tailwind**: Utility-first CSS, no naming conflicts, tree-shakeable
- **Radix Primitives**: Accessible headless components (dialogs, selects, etc.)
- **Lucide Icons**: Consistent, tree-shakeable icon set

#### Component Quality Standards:
1. **Loading States**: Skeleton screens, not spinners
2. **Empty States**: Actionable CTAs, not just "No data"
3. **Error States**: Specific messages + retry actions
4. **Accessibility**: Keyboard navigation, ARIA labels, focus management
5. **Responsive**: Mobile-first design
6. **Feedback**: Toast notifications for async actions

---

## 8. Performance Optimizations

### Strategies:
1. **React Query Caching**: Stale-while-revalidate pattern
2. **Code Splitting**: Lazy load routes with React.lazy()
3. **Virtual Scrolling**: For large result tables (react-window)
4. **Debounced Filters**: Reduce query frequency (300ms delay)
5. **Optimistic Updates**: Immediate UI feedback
6. **Parallel Data Fetching**: Multiple queries in parallel
7. **Memoization**: useMemo for expensive computations, React.memo for components
8. **Bundle Optimization**: Vite's automatic code splitting

---

## 9. Error Handling Strategy

### Layers:
1. **API Layer**: Standardized error responses
2. **React Query**: Built-in error handling with retry
3. **Error Boundaries**: Catch render errors
4. **Toast System**: User-facing error messages
5. **Logging**: Console errors in dev, structured logs in prod

### User Experience:
- **Graceful Degradation**: App remains functional despite partial failures
- **Actionable Messages**: "Retry" buttons, not just error text
- **Context-Aware**: Different handling for network vs validation errors

---

## 10. Development Workflow

### Tools:
- **Vite**: Lightning-fast HMR, optimized builds
- **TypeScript**: Strict mode enabled
- **ESLint**: Catch code issues
- **Prettier**: Consistent formatting
- **Supabase CLI**: Local development with migrations

### Git Workflow:
- Feature branches
- Conventional commits
- Clear commit messages

---

## Summary: Key Architectural Wins

| Aspect | Decision | Benefit |
|--------|----------|---------|
| Backend | Supabase | PostgreSQL power + TypeScript + Edge Functions + Real-time |
| State | React Query + Zustand | Automatic caching, optimistic updates, minimal boilerplate |
| Types | Zod + Generated + Strict TS | Runtime + compile-time safety, zero drift |
| LLM | Edge Functions + Strategy | Secure, scalable, provider-agnostic |
| UI | shadcn/ui + Tailwind | High-quality, customizable, accessible |
| Perf | Query caching + virtualization | Fast even with large datasets |
| Schema | Normalized PostgreSQL | Efficient queries, referential integrity |

This architecture balances **rapid development** (demo deadline) with **production-grade practices** (maintainability, scalability, type-safety).

