

# CLAUDE.md — Kinetic App Rules
## Always Do First
- **Before writing any frontend code: stop and think through typography, spacing, color, depth, and animation. Apply high-craft design decisions — never default to generic Tailwind utility classes without intention.**
- Read this file fully before writing any code
- Check existing files and folder structure before creating new ones
- Never duplicate components that already exist — reuse them
- Screenshot after building any page and review it



## Project Overview
Kinetic is a calisthenics training tracker built with Next.js 14 (App Router), Tailwind CSS, and Supabase. Dark mode, green accent, mobile first, pill-shaped UI. Use this file as a guide — the user may change direction at any time, always follow their latest instruction over anything written here.

## Always Do First
- Read this file fully before writing any code
- Check existing files and folder structure before creating new ones
- Never duplicate components that already exist — reuse them
- Screenshot after building any page and review it

## Tech Stack
- Next.js 14 App Router
- Tailwind CSS
- Supabase (@supabase/supabase-js, @supabase/ssr)
- Inter font (Google Fonts)
- Deployed on Vercel

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
Never hardcode these. Never commit `.env.local`.

## Local Server & Screenshot Workflow
- Start dev server: `npm run dev` (http://localhost:3000)
- Don't start a second instance if already running
- Screenshot script lives at `screenshot.mjs` in the project root
- Run: `node screenshot.mjs http://localhost:3000/page-name`
- Optional label: `node screenshot.mjs http://localhost:3000/dashboard dashboard`
- Screenshots saved to `./screenshots/screenshot-N.png`
- After screenshotting, read the PNG and visually review it
- Do at least 2 review rounds — fix issues, re-screenshot, confirm fixed
- Stop when things look good or the user says so

## Screenshot Setup
Create `screenshot.mjs` in the project root if it doesn't exist:
```js
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = './screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const n = files.length + 1;
const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const filepath = path.join(dir, filename);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2' });
await page.screenshot({ path: filepath, fullPage: true });
await browser.close();
console.log(`Screenshot saved: ${filepath}`);
```

## Screenshot Review Checklist
After every screenshot, check these and fix anything that looks off:
- Background is dark — not white or gray
- Primary accent is green — not blue or indigo
- Buttons are pill-shaped
- Cards have rounded corners
- Font looks clean and modern
- Text hierarchy is clear
- Spacing feels intentional
- Looks good at 390px mobile width
- Hover states exist on interactive elements


## Folder Structure
```
/app
  /auth
  /onboarding
  /dashboard
  /history
  /progress
  /plan
  /skills
  /feed
  /leaderboard
  /search
  /profile/[username]
  /settings
/components
/lib
  /supabase.ts
/types
```

## Database Tables
- `profiles` — id, username, name, bio, avatar_url, level, created_at
- `exercises` — id, name, type (reps/weighted/timed), is_default, user_id
- `training_plan` — id, user_id, name
- `plan_days` — id, plan_id, day_of_week, is_rest
- `plan_exercises` — id, plan_day_id, exercise_id, sets, reps, weight, hold_time, rest_timer_seconds
- `sessions` — id, user_id, date, feel (1-5), notes
- `session_exercises` — id, session_id, exercise_id, type
- `session_sets` — id, session_exercise_id, reps, weight, hold_time_seconds
- `skill_progressions` — id, user_id, skill_name, current_stage, updated_at
- `follows` — id, follower_id, following_id
- `tags` — id, user_id, name
- `session_tags` — id, session_id, tag_id


## General Guidelines
- Always handle loading and error states
- Use RLS on all Supabase tables
- Mobile first — 390px base width
- Reuse components, don't duplicate
- Follow the user's latest instruction — this file is a guide not a rulebook
```

