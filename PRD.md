# Product Requirements Document (PRD): ellipticalworkouts.com

## 1. Project Overview
A fast, lightweight, programmatic SEO & affiliate site targeting high-intent elliptical workout queries.
Tech Stack: Astro (SSG), Tailwind CSS, Vanilla JS for interactive timer widgets.

## 2. Core Architecture
- Data source: `src/data/workouts.json` (Array of workout objects).
- Central configuration: `src/config/site.ts` (Site metadata, affiliate URL & tag resolver).
- Shared SEO layout: `src/layouts/BaseLayout.astro` (OpenGraph, X Cards, canonical URLs, JSON-LD injection).
- Dynamic Route: `src/pages/workouts/[slug].astro` pre-rendered via `getStaticPaths()`.
- Directory / Hub: `src/pages/index.astro` listing workouts filtered by keyword search, duration, and difficulty.
- SEO Discovery: `src/pages/sitemap.xml.ts` and `src/pages/robots.txt.ts`.

## 3. Key Features per Workout Page
- **SEO & Schema**: Pre-rendered static HTML with OpenGraph tags, `ExercisePlan` JSON-LD schema, and `BreadcrumbList` JSON-LD schema.
- **Spec Summary**: Duration, Difficulty, Est. Calories, Resistance Range, Target RPM, Joint Impact.
- **Interval Breakdown**: Clean visual table/timeline of intervals (Warmup, Work, Rest, Cooldown) with live active-row highlighting.
- **Interactive Timer**: Client-side countdown timer with:
  - Play / Pause / Reset and Prev / Next interval stepping controls.
  - Current interval name, resistance/RPM cues, countdown display, progress bars, and "Up Next" preview.
  - Sound beeps via Web Audio API (no external audio assets) + Mute/Unmute toggle.
  - Screen Wake Lock API (`navigator.wakeLock`) so phone screens don't sleep while working out.
- **Affiliate Recommendation Block**: Contextual machine callout ("Recommended Machine for this Routine") with key hardware specs (flywheel, stride, incline) and direct affiliate link button.

## 4. Acceptance Criteria
- Run `npm test` (Vitest) and `npm run build` with zero errors.
- Dynamic routes generate cleanly from JSON (`8` realistic elliptical workouts including all 4 core slugs).
- 100/100 Core Web Vitals on mobile (zero heavy frontend frameworks, pure vanilla script in Astro).
