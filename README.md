# Curio

> An AI-powered learning companion that helps you capture, organize, and deepen your understanding of topics you care about.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| AI Inference | [Groq](https://groq.com) |
| Package Manager | [pnpm](https://pnpm.io) |

---

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

---

## Installation

```bash
# Clone the repository
git clone https://github.com/Praddyy-yy/Curio.git
cd curio

# Install dependencies
pnpm install
```

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_DB_URL` | PostgreSQL connection string (migration runner only — never exposed to browser) |
| `GROQ_API_KEY` | Your Groq API key (Whisper transcription + Llama analysis) |

> **Never commit `.env.local` to version control.**

---

## Run Commands

```bash
# Start the development server
pnpm dev

# Type-check the project
pnpm tsc --noEmit

# Run the linter
pnpm lint

# Build for production
pnpm build

# Start the production server (after build)
pnpm start
```

The dev server runs at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/            # Next.js App Router pages and layouts
components/     # Shared React components
  ui/           # shadcn/ui components
lib/            # Shared utilities and clients
  supabase/     # Supabase client (browser + server)
data/           # Static / curated data
  topics/       # Manually curated topic definitions
docs/           # Project documentation
  learn.md      # Learning notebook
  architecture.md  # Architecture overview
  decisions.md  # Architectural Decision Records
public/         # Static assets
```

---

## Documentation

| Doc | Description |
|---|---|
| [`docs/architecture.md`](./docs/architecture.md) | System architecture and tech stack overview |
| [`docs/decisions.md`](./docs/decisions.md) | Architectural Decision Records (ADRs) |
| [`docs/learn.md`](./docs/learn.md) | Running learning notebook |

---

## Known Limitations

Curio v1 intentionally focuses on an individual practice experience. Features such as collaborative learning, advanced analytics, multilingual support, and offline recording are intentionally deferred to future releases to keep the MVP focused.

---

## License

MIT
