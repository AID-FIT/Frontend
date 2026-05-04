# AID-Fit Agent Guide

## Project Overview

AID-Fit is an AI fashion recommendation mobile app. The app lets users upload clothing images and describe the situation or mood they want, then shows mock AI outfit recommendations with styling reasons.

Current scope is the initial React Native frontend only. Use mock data first and do not connect a real backend or real authentication flow yet.

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation
- Zustand for lightweight state management
- Axios for the future API client
- Mock data in `src/mocks`

## Folder Structure

```text
src/
  navigation/       Navigation containers, stacks, tabs, route types
  screens/          App screens grouped by feature
    auth/
    onboarding/
    home/
    recommend/
    closet/
    profile/
  components/
    common/         Buttons, cards, inputs, chips, loading UI
    fashion/        Product, outfit, upload, AI badge components
    layout/         Screen layout primitives
  constants/        Colors, spacing, radius, typography, shadows
  hooks/            Reusable app hooks
  services/         Axios client and future API service modules
  store/            Zustand stores
  types/            Shared TypeScript types
  mocks/            Mock products, outfits, closet data, user data
```

## Coding Conventions

- Before changing UI or visual behavior, read `design.md` and follow it as the design source of truth.
- Use TypeScript strictly and keep props/types explicit.
- Keep components reusable and focused.
- Put shared design tokens in `src/constants`; avoid repeated hard-coded style values.
- Use mock data from `src/mocks` instead of embedding fixture arrays inside screens.
- Keep visible UI production-like, clean, and spacious.
- Do not add backend logic or real authentication until explicitly requested.
- Login buttons may update local state and move to onboarding/main flow.
- All user-facing app text must be Korean. English is allowed only for brand names such as `AID-Fit`, `Google`, and `Apple`.

## Design System

Full design rules live in `design.md`.

Follow `design.md` before changing UI. The current active palette is PlayStation-inspired blue, black, white, and cool neutral surfaces. Preserve existing typography, radius, shadow, layout, and motion rules unless the user explicitly asks to change them.

## How To Run

```bash
npm install
npx expo start
```

Useful checks:

```bash
npm run typecheck
```

## Done Criteria

- The app runs with `npm install` and `npx expo start`.
- All requested screens exist: Login, Onboarding, Home, Style Recommend, Recommendation Result, Closet, Profile.
- Navigation works between login, onboarding, tabs, style recommendation, and result screen.
- Home screen displays a mock 2-column product grid.
- Style recommendation flow navigates to a result screen with mock recommendation data.
- TypeScript has no obvious errors.
- All user-facing app text is Korean.
