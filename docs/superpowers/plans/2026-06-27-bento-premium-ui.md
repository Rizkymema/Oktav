# Bento Premium UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the website workspace and shell UI into a high-end Bento Grid layout in light mode, adhering to the specifications of `D:\skill\Bento Premium.md`.

**Architecture:** We will transition the main layout, sidebar, topbar, and icon rail to a consistent soft-light theme. The empty state of the workspace will be converted into a responsive Bento Grid of dashboard cards.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Lucide React

---

### Task 1: Redesign global theme variables and styles
**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Clean up color system variables and monochrome overrides**
  We will update the custom theme variables in `app/globals.css` to use soft light mode colors with charcoal/slate text and clean shadows.
- [ ] **Step 2: Add CSS utility classes for Bento Grid cards and micro-interactions**
  Include specific styles for modular card layouts, hover effects, and rounded elements.

### Task 2: Redesign Workspace Interface into a Bento Grid Dashboard
**Files:**
- Modify: `components/workspace/WorkspaceInterface.tsx`

- [ ] **Step 1: Update imports and quick skills list**
  Align the skill icon buttons to use clean tailwind outline styling.
- [ ] **Step 2: Rewrite `OnboardingState` function to render a 12-column Bento Grid**
  Replace the vertical greeting page with a responsive grid of 5 cards (Hero & Composer, Quick Skills, Limit & Stats, Gateway Connections, and Recent Projects).

### Task 3: Redesign Sidebar & Topbar for color and shape consistency
**Files:**
- Modify: `components/workspace/WorkspaceSidebar.tsx`
- Modify: `components/workspace/WorkspaceTopbar.tsx`

- [ ] **Step 1: Polish sidebar active tab styling and action buttons**
  Set button classes to use soft gray backgrounds and black/charcoal backgrounds for the CTA, rather than indigo.
- [ ] **Step 2: Redesign topbar to use light background**
  Update the background and border classes of `WorkspaceTopbar` to feel part of the soft-light layout.

### Task 4: Redesign Icon Rail for unified light layout
**Files:**
- Modify: `components/workspace/WorkspaceIconRail.tsx`

- [ ] **Step 1: Transition Left Rail to light background**
  Change the sidebar rail to slate-50/80 background with slate border, dark logo, and clean dark indicators.
