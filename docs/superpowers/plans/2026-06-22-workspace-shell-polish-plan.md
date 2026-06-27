# Workspace Shell Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyamakan shell `/workspace` dengan bahasa visual chat baru tanpa mengubah flow runtime.

**Architecture:** Polishing dilakukan pada komponen shell dan halaman project detail. Gunakan test SSR ringan untuk memverifikasi class/layout utama tetap muncul dan route/runtime bindings tidak rusak.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind CSS, Vitest, react-dom/server

---

## File Map

- Modify: `components/workspace/WorkspaceShell.tsx`
- Modify: `components/workspace/WorkspaceIconRail.tsx`
- Modify: `components/workspace/WorkspaceTopbar.tsx`
- Modify: `components/workspace/WorkspaceSidebar.tsx`
- Modify: `components/workspace/NotificationCenter.tsx`
- Modify: `app/workspace/projects/[projectId]/page.tsx`
- Create: `tests/workspace/workspace-shell-surfaces.test.ts`
- Create: `tests/workspace/project-details-page.test.ts`
