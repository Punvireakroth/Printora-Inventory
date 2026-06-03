# Printora Inventory

Stock management platform (Next.js App Router + Supabase + bilingual `en` / `km`). Roadmap and checklists live in [docs/implementation-phases.md](docs/implementation-phases.md).

## Contributing / onboarding

**New developer?** Start here: **[docs/developer-onboarding.md](docs/developer-onboarding.md)** (environment, Supabase CLI, repo map, suggested small first tasks).

## Local development

```bash
npm install
cp .env.example .env.local   # fill NEXT_PUBLIC_SUPABASE_* from Supabase Dashboard → Settings → API
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database (Supabase CLI)

Scripts: `npm run db:login`, `npm run db:link`, `npm run db:push`, etc. Details in [docs/developer-onboarding.md](docs/developer-onboarding.md).

## Tech stack

Next.js 15, TypeScript, Tailwind v4, shadcn-style UI, Supabase (Auth + DB + Storage), next-intl (planned Phase 1.3).

## Reset data 

### Preview counts (no changes)
npm run db:reset-data -- --confirm --dry-run

### Run reset (destructive)
npm run db:reset-data -- --confirm

### Also clear shop name, Telegram tokens, and other settings
npm run db:reset-data -- --confirm --reset-settings

## Deploy

Deploy on [Vercel](https://vercel.com/new) — see [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
