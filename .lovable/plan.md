# Plan: Blank Project Start

## Goal
Replace the current placeholder home page (`src/routes/index.tsx`) with a completely blank, empty page. No database, no backend, no Lovable Cloud.

## Changes
1. **`src/routes/index.tsx`** — Remove the placeholder SVG/`data-lovable-blank-page-placeholder` image and replace the component body with an empty `<div>` (or empty fragment) so the page renders nothing but a blank background.
2. **`src/routes/__root.tsx`** head metadata — Keep the default `title`/`description` but set them to generic neutral values (e.g. "My App") instead of "Lovable App" / "Lovable Generated Project" placeholders.

## Out of scope
- No database, no Supabase/Lovable Cloud, no auth.
- No new routes, no components, no dependencies.

## Result
Visiting `/` shows a completely blank page.
