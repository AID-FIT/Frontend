# AID-Fit Design System

This document is the source of truth for UI design decisions. Read it before changing screens, components, typography, spacing, or motion.

## Design Intent

AID-Fit should feel clean, trustworthy, and polished while staying friendly. The UI should not look like a generic AI demo. Keep the fashion app context visible through icons, images, product cards, upload states, and outfit composition rather than long explanatory copy.

Use the current AID-Fit typography, radius, shadow, layout, and motion rules. The active color system is PlayStation-inspired: crisp white, pure black, PlayStation Blue, neutral surfaces, and restrained semantic accents.

Current product direction:

- Minimal, Toss-like first impression with large whitespace and very little explanatory copy.
- Warmth should come from Pretendard, generous spacing, gentle motion, and Korean copy rather than decorative illustration.
- The app should feel like a polished fashion utility, not an "AI demo" interface.
- Primary screens should use icon/image-led structure before adding text.

## Color Rule

Use the active PlayStation-inspired project colors from `src/constants/colors.ts`:

- Primary / CTA: PlayStation Blue `#0070d1`
- Primary Pressed: `#0064b7`
- Primary Active: `#004d8d`
- Commerce Accent: `#d53b00` only for buy/store-like actions if such a flow is added later
- Canvas Dark: `#000000`
- Surface Dark Elevated: `#121314`
- Surface Dark Card: `#181818`
- Canvas Light / Card: `#ffffff`
- Surface Soft: `#f3f3f3`
- Surface Card: `#f5f7fa`
- Text / Ink: `#000000`
- Light Body Text: `rgba(0,0,0,0.6)`
- Muted Text: `#6b6b6b`
- Ash / Disabled: `#cccccc`
- Dark Body Text: `rgba(255,255,255,0.7)`
- Hairline Light: `#f3f3f3`
- Hairline Dark: `rgba(229,229,229,0.2)`
- Link Dark Accent: `#53b1ff`
- Success: `#149e61`, `#026b3f`, `rgba(20,158,97,0.16)`

Allowed color behavior:

- Use PlayStation Blue for primary buttons, active tabs, links, and small brand emphasis.
- Use pure white and near-black/black surfaces as the main app canvas pair.
- Use cool neutral surfaces for cards, dividers, image placeholders, and secondary states.
- Use green only for success/recommendation badges.
- Do not introduce Kraken Purple, warm cream, brown, or unrelated accent palettes unless explicitly requested.

## Typography

Use Pretendard for all app text.

Font mapping:

- Display / headings: `Pretendard-ExtraBold` or `Pretendard-Bold`
- UI / body: `Pretendard-Regular`, `Pretendard-Medium`, or `Pretendard-SemiBold`

Hierarchy:

| Role | Size | Weight | Line Height | Letter Spacing |
| --- | ---: | ---: | ---: | ---: |
| Display Hero | 48 | 700-800 | 1.17 | -1 |
| Section Heading | 36 | 700-800 | 1.22 | -0.5 |
| Sub-heading | 28 | 700 | 1.29 | -0.5 |
| Feature Title | 22 | 600 | 1.20 | 0 |
| Body | 16 | 400 | 1.38 | 0 |
| Body Medium | 16 | 500 | 1.38 | 0 |
| Button | 16 | 500-600 | 1.38 | 0 |
| Caption | 14 | 400-700 | 1.43-1.71 | 0 |
| Small | 12 | 400-500 | 1.33 | 0 |

Text rules:

- Prefer fewer words and larger, clearer text.
- Keep all user-facing app text Korean except brand names such as `AID-Fit`, `Google`, and `Apple`.
- Avoid visible text that explains AI features. Prefer natural product language such as style, outfit, closet, look, recommendation, and mood.
- Use icons and visual states before adding explanatory copy.
- Current login hero title is intentionally larger than the default section title: `42px / 54px`, heavy Pretendard.
- Onboarding title uses a smaller display size: `28px / 36px`, heavy Pretendard.

## Components

### Buttons

Use 12px radius for buttons. Do not use pill buttons for primary actions.

Primary button:

- Background: PlayStation Blue `#0070d1`
- Text: White
- Padding: approximately `13px 16px`
- Radius: `12px`
- Shadow: whisper-level only

Outlined button:

- Background: White
- Text: PlayStation Blue
- Border: PlayStation Blue or neutral border depending on hierarchy
- Radius: `12px`

Secondary gray:

- Background: project `surface` (`#f5f7fa`) or `surfaceSoft` (`#f3f3f3`)
- Text: Ink / PlayStation Blue depending on hierarchy
- Radius: `12px`

### Cards

- Background: White
- Radius: 16px default
- Border: `#f3f3f3`
- Shadow: very subtle only
- Avoid nested cards unless the inner element is a true repeated item.

### Badges

- Success/recommendation state: PlayStation semantic green (`rgba(20,158,97,0.16)` background, `#026b3f` text).
- Radius: 6-8px, not pill by default.
- Text should be short, such as `추천`.

### Inputs

- White surface
- 12px radius
- 16px text
- Neutral border
- Keep placeholder short.

## Radius Scale

Use:

- `3px`
- `6px`
- `8px`
- `10px`
- `12px`
- `16px`
- `9999px` only for small indicators, dots, or true circular/pill primitives
- `50%` only for circular elements

Avoid:

- Overly round 24-38px cards unless there is a clear visual reason.
- Pill-shaped CTA buttons.

## Shadow & Depth

Use whisper-level elevation:

- Subtle: `rgba(0,0,0,0.03) 0px 4px 24px`
- Micro: `rgba(16,24,40,0.04) 0px 1px 4px`

Avoid:

- Heavy floating cards
- Glow effects except very restrained icon/indicator states
- Decorative blobs or orbs

## Layout

Spacing scale:

`1, 2, 3, 4, 5, 6, 8, 10, 12, 13, 15, 16, 20, 24, 25`

Layout rules:

- Use spacious layouts with strong hierarchy.
- Prefer icons/images for scanability.
- Keep descriptions short or remove them if the visual context is enough.
- Avoid cluttered decorative illustrations.
- Product and outfit cards should emphasize visual blocks first, then minimal text.

## Motion

Motion should be subtle and purposeful.

Allowed:

- Gentle floating icons
- Small active indicators
- Short shimmer/loading accents
- Typing/deleting text loops on first-impression copy when the page has enough whitespace.
- Short timed transition screens, such as a 2-second onboarding intro.

Avoid:

- Overly playful or distracting animation
- Effects that make the app feel like a toy or AI demo
- Repeating large movement around primary content

Current motion states:

- Login headline loops through typing and deleting `내 스타일을 가볍고\n빠르게 완성해요`.
- Login icons float in sync with the active bottom indicator bar. The active icon should lift slightly while the bar sits directly below the same icon.
- The second login headline line is visually right-aligned, but the text itself types from left to right inside its final right-aligned slot.
- Onboarding intro waits about 2 seconds before continuing to onboarding.
- Onboarding screen title is static. Do not use the typing loop there unless explicitly requested again.

## Screen Guidance

### Login

- Keep it minimal.
- Do not show the logo image or `AID-Fit` wordmark on the current login screen.
- Use the headline `내 스타일을 가볍고\n빠르게 완성해요`.
- Place the headline at the top-left.
- The first headline line is left-aligned.
- The second headline line, `빠르게 완성해요`, is right-aligned while still typing left-to-right from its own line start.
- Keep the animated icon group and active indicator below the headline area.
- Use social buttons at the bottom.
- No preview card.
- No long AI explanation.
- Maintain PlayStation Blue / black / white / neutral palette.

### Onboarding Intro

- Show a blank white screen after login and before onboarding.
- Center the message `이제 사용자님에 대해\n알아볼게요`.
- Use the same calm, bold heading feel as the onboarding title.
- Stay on screen for about 2 seconds, then continue automatically.
- Do not add buttons, icons, loaders, or extra explanation.

### Onboarding

- The top title is static, not animated.
- Current title format: `{username}님은..`
- Current mock username source is `mockUser.name`.
- Keep the age, style chip selection, upload grid, and `시작하기` CTA structure.
- Keep copy short and Korean.

### Home

- Use a clear heading and visual recommendation area.
- Product grid should prioritize image/icon blocks.
- Keep product metadata minimal.

### Recommendation

- Upload and prompt states should be visually obvious.
- CTA text should be short.
- Do not over-explain the AI process.

### Result

- Outfit cards should lead with visual blocks.
- Styling explanation should be concise and secondary.

## Implementation Rules

- Before changing UI, check this document and the tokens in `src/constants`.
- Prefer editing shared tokens/components before one-off screen styles.
- If a design value conflicts with this document, update this document first or explicitly note why the exception is needed.
- Run `npm run typecheck` after UI changes.
