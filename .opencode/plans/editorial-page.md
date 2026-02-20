# Daily Editorial Page - Implementation Plan

## Overview
Create a new page at `/dashboard/daily-editorial/` navigated to from the "Read Now" button on the Dashboard's Today's Trio section.

## Files to Modify

### 1. `app/globals.css` - Add font imports
Add after the existing Arimo import:
```css
@import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Fahkwang:wght@400;500;600;700&display=swap');
```
Add CSS variables:
```css
--font-tinos: 'Tinos', serif;
--font-fahkwang: 'Fahkwang', sans-serif;
```

### 2. `tailwind.config.ts` - Add font families
```ts
'tinos': ['var(--font-tinos)', 'serif'],
'fahkwang': ['var(--font-fahkwang)', 'sans-serif'],
```

### 3. `app/layout.tsx` - Import fonts via next/font/google
Import Tinos and Fahkwang, add their CSS variables to body.

### 4. `components/ResponsiveDashboardContent.tsx` (lines 186-208)
Wrap the Daily Editorial div in `<Link href="/dashboard/daily-editorial">`.

### 5. NEW: `app/dashboard/daily-editorial/page.tsx`
Full editorial page with:
- Back to dashboard button (top-left)
- Hero section (DAILY NEWS ANALYSIS tag, heading, description)
- Two-column layout (news cards left, sidebar widgets right)
- 5 sample news cards with tags, descriptions, actions
- Right sidebar: Calendar, Filter by Subject, Today at a Glance, 14-Day Streak, Your Learning Streak

## Responsiveness
All values use clamp() for 1024px-1920px+ desktop range.
