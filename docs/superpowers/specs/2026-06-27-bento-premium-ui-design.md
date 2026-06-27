# Bento Premium UI Design Spec

Design specification for redesigning the HermesClaw AI Assistant workspace using the Bento Premium Design System guidelines.

## 1. Objectives

- Transform the workspace home (onboarding screen) into a modular Bento Grid dashboard.
- Establish a premium, minimal, and elegant light theme with high contrast typography and clean borders, using arang/charcoal/black accents as defined in `D:\skill\Bento Premium.md`.
- Ensure consistent component radii (`rounded-2xl` / `16px`), soft shadows, and clean margins/padding.

## 2. Target Layout (Bento Grid)

We will restructure `WorkspaceInterface.tsx`'s `OnboardingState` into a 12-column grid layout consisting of 5 modular cards:

```
+------------------------------------------+-----------------------+
|                                          |                       |
|           Card A: Hero & Composer        |  Card B: Quick Skills |
|           (col-span-8, row-span-2)       |  (col-span-4)         |
|                                          |                       |
+--------------------+---------------------+-----------------------+
|                    |                     |                       |
| Card C: Limit      | Card D: Gateway     | Card E: Recent        |
| (col-span-4)       | (col-span-4)        | (col-span-4)          |
|                    |                     |                       |
+--------------------+---------------------+-----------------------+
```

### Card details:
1. **Card A (Hero & Prompt Composer)**: Integrates the robot status, greeting copy, and prompt composer field. This acts as the focal interaction point.
2. **Card B (Quick Skills)**: Offers a cleanly spaced vertical/grid list of the 6 quick skill pills (Slides, Documents, Images, Sheets, Websites, Videos) with modern outline icons and elegant hover transitions.
3. **Card C (Daily Limit)**: Visualizes the credits used and total credits with a minimalist progress bar.
4. **Card D (IM Channels)**: Displays the gateway status (Live/Offline) and clean integration buttons for WhatsApp, Telegram, Discord, etc.
5. **Card E (Recent Projects)**: Displays a checklist of the top 3 projects in the history with their status indicators.

## 3. Style and Color System

In `app/globals.css`, we will:
- Set up a clean neutral background color palette (`#F8FAFC` and `#FFFFFF`).
- Apply hairline borders (`1px solid #E2E8F0`).
- Remove conflicting monochrome overrides and implement soft shadows for a premium layered feel.
- Set type hierarchies (large headlines, spacious line-heights, Outfit/Inter sans-serif style).
