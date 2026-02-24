# Skills Manager POC

Next.js + Supabase proof-of-concept for a Resource Scheduling and Skills Matrix dashboard.

## What it includes

- Dense matrix dashboard (`/`) with:
  - Role-grouped rows and show columns
  - Status color coding (`Active`, `Refresh`, `Training`, `NA`, `Red`)
  - Cell edit modal for status + private notes
  - Client-side search/role/capability filtering
  - Dashboard AI launcher that opens a floating staffing chat window
- Backfill management (`/backfill/[showId]`) with:
  - Show selector
  - Role-based permanent crew and backup lists
  - Drag-and-drop ranking updates
- Mock access dropdown in header:
  - `Read Only`: cannot edit and cannot view notes
  - `Manager` / `Admin`: full edit access
- Supabase migration + deterministic seeding from JSON fixtures

## Environment variables

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional, defaults to `gemini-2.0-flash`)
- `APP_MOCK_ROLE_DEFAULT` (optional, defaults to `Read Only`)

## Supabase setup

1. Install Supabase CLI
2. Link to your hosted project
3. Push migrations
4. Run seed script

```bash
supabase link --project-ref <your-project-ref>
supabase db push
npm run seed:db
```

## Local development

```bash
npm install
npm run dev
```

## Gemini key safety

- Store `GEMINI_API_KEY` only in runtime environment secrets (`.env.local` for local use).
- Do not commit real API keys to git.
- Do not place real keys in `README.md`, test fixtures, or client-exposed `NEXT_PUBLIC_*` variables.

## Tests

```bash
npm run test
```

## Seed fixture files

- `supabase/seed/fixtures/roles.json`
- `supabase/seed/fixtures/name_pools.json`
- `supabase/seed/fixtures/shows.json`

Edit these files to adjust role catalog, names, and show list while keeping deterministic generation.
# SkillsMatrix
