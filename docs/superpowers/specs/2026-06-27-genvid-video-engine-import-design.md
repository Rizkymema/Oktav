# Genvid Video Engine Import Design

## Overview

This spec imports the video-generation engine from `D:\genvid\Pixelle-Video-main` into `AI ASSISTENT` so the existing workspace can produce real video output through the imported engine instead of the current single-frame MP4 fallback.

The current `AI ASSISTENT` architecture already has the right seams:

- artifact type resolution for `mp4`
- task routing through `TaskRequestResolver`
- runtime execution through `ToolExecutor`
- artifact persistence inside `public/artifacts`
- task and artifact display in the existing workspace UI

The gap is execution quality. Video requests currently succeed through a lightweight `ffmpeg` path that creates a short MP4 from one generated image. That is useful as a placeholder, but it is not a real multi-step video pipeline.

`D:\genvid\Pixelle-Video-main` already contains that missing pipeline:

- FastAPI backend for video generation and task polling
- Python services for narration, frame, media, TTS, and final rendering
- templates, workflows, resources, and BGM assets
- generated file serving and async task tracking

The goal of this work is to make `AI ASSISTENT` the single product surface while importing the Genvid engine as an internal video module.

## Goals

- Import the Genvid video engine into this repository in a way that preserves `AI ASSISTENT` as the main user-facing system.
- Route `mp4` generation requests through the imported Genvid engine when it is enabled and healthy.
- Keep the current Hermes-style task flow, artifact cards, project shell, and API surface intact.
- Isolate Python runtime concerns from the Next.js application so the repository remains maintainable.
- Provide a safe fallback path when the Genvid engine is unavailable or not configured.

## Non-Goals

- Replacing the `AI ASSISTENT` workspace UI with Genvid's Streamlit UI.
- Merging Python application structure directly into the Next.js root.
- Rewriting the whole Hermes runtime around Python-native task execution.
- Removing the current fallback MP4 renderer on day one.
- Refactoring unrelated document, image, sheet, or web generation paths.

## Imported Scope

The imported module should include the parts of `D:\genvid\Pixelle-Video-main` needed to run video generation as an embedded engine:

- `api/`
- `pixelle_video/`
- `workflows/`
- `templates/`
- `resources/`
- `bgm/`
- `config.example.yaml`
- `pyproject.toml`
- lockfile and startup scripts required for local service boot

The following Genvid areas are intentionally not integrated into the main product UX:

- `web/` Streamlit UI as a first-class surface
- standalone packaging workflows that only exist for the original project distribution
- duplicate docs that are not required to run or maintain the embedded module

These files may still be preserved in the imported module if required by runtime internals, but they are not exposed as the user-facing interface.

## Design Principles

### Preserve the current shell

The user should continue creating tasks from the existing `AI ASSISTENT` workspace. Video capability upgrades must happen behind the current task, chat, and artifact interfaces.

### Isolate the Python subsystem

Genvid must live under a dedicated folder inside this repository so Node, Next.js, and Python concerns stay separated.

### Prefer adapter integration over rewrite

The existing `TaskRequestResolver`, `HermesGenerationService`, and `ToolExecutor` already define a clean seam. The imported engine should attach to that seam through a dedicated provider adapter.

### Keep fallback behavior truthful

If the imported engine is disabled, missing dependencies, unhealthy, or misconfigured, the system must report that clearly and either:

- fall back to the legacy `ffmpeg` path when explicitly allowed, or
- fail safely with a setup-oriented message

It must not pretend that the full Genvid pipeline ran when it did not.

## Target Structure

The import should be organized like this:

- `integrations/genvid/`
- `integrations/genvid/api/`
- `integrations/genvid/pixelle_video/`
- `integrations/genvid/workflows/`
- `integrations/genvid/templates/`
- `integrations/genvid/resources/`
- `integrations/genvid/bgm/`
- `integrations/genvid/pyproject.toml`
- `lib/hermes/video/genvid-client.ts`
- `lib/hermes/video/genvid-service.ts`
- `lib/hermes/video/genvid-types.ts`
- `lib/hermes/video/genvid-config.ts`

This keeps imported engine files physically separate from TypeScript runtime adapters.

## Runtime Model

### 1. Video provider selection

`ToolExecutor` remains the entry point for `video.generate_mp4`, but instead of directly rendering the fallback MP4 first, it should:

1. read video provider config
2. decide whether Genvid is enabled
3. check whether the Genvid API is reachable
4. submit the generation request to Genvid if healthy
5. poll the external task until completion
6. download or mirror the resulting artifact into `AI ASSISTENT/public/artifacts`
7. register the mirrored file as the local artifact for the Hermes task

If any required condition fails, the executor should move to the configured fallback policy.

### 2. Embedded Genvid service boundary

The imported Genvid engine should be treated as an internal service, not as a library directly embedded into Node execution.

The preferred boundary is HTTP against the imported FastAPI app:

- health: `GET /health`
- generate async: `POST /api/video/generate/async`
- task status: `GET /api/tasks/{task_id}`
- output file access: `GET /api/files/...`

This is the cleanest boundary because it respects how Genvid is already built.

### 3. Auto-start support

The system should support two operating modes:

- `connect_only`: `AI ASSISTENT` connects to an already-running Genvid API
- `managed_local`: `AI ASSISTENT` can start the imported Genvid API process locally

`managed_local` should be optional and controlled by config. The first implementation may keep startup simple by spawning the imported Python app with a configured command and a known working directory.

## Data Flow

### Input mapping

The current task model in `AI ASSISTENT` should be mapped into the Genvid request body with a deterministic adapter.

Minimum mapping:

- `task.goal` or `task.prompt` -> `text`
- task mode -> `mode`
- title derived from prompt -> `title`
- video scene defaults -> `n_scenes`
- selected template -> `frame_template`
- selected media workflow -> `media_workflow`
- selected TTS workflow -> `tts_workflow`
- style prompt -> `prompt_prefix`
- selected BGM -> `bgm_path`

If the current workspace does not yet expose all advanced Genvid controls, the adapter should use stable defaults from local config rather than inventing random values.

### Output mapping

When Genvid completes successfully, the adapter should:

1. read the `video_url`
2. download the resulting file to `public/artifacts/<slug>.mp4`
3. attach the mirrored local file to the Hermes task
4. preserve useful metadata such as duration and file size in the task summary

The workspace should continue treating the artifact as a local downloadable file under the existing artifact surface.

## Configuration

The integration should add explicit environment-driven configuration:

- `GENVID_ENABLED`
- `GENVID_API_URL`
- `GENVID_ROOT`
- `GENVID_AUTO_START`
- `GENVID_START_COMMAND`
- `GENVID_HEALTH_TIMEOUT_MS`
- `GENVID_POLL_INTERVAL_MS`
- `GENVID_POLL_TIMEOUT_MS`
- `GENVID_FALLBACK_MODE`

Recommended fallback values:

- `GENVID_ENABLED=true`
- `GENVID_ROOT=D:\genvid\Pixelle-Video-main` during import bootstrap, then repository-local path after migration
- `GENVID_AUTO_START=false` by default
- `GENVID_FALLBACK_MODE=legacy_ffmpeg`

`.env.example` must document these variables clearly.

## Error Handling

The integration should return safe user-facing errors in these cases:

- Genvid disabled
- Genvid not installed in the imported location
- Genvid API not reachable
- Genvid task failed
- Genvid output file download failed
- imported engine timed out

Each error should become a clear task message such as:

- `Video engine belum aktif.`
- `Video engine aktif tetapi service tidak merespons.`
- `Render video gagal pada engine Genvid.`
- `Hasil video selesai dirender tetapi gagal disalin ke artifact lokal.`

Internal command details, Python traces, provider keys, or raw backend internals must not be exposed directly to the UI.

## Testing Strategy

### Unit coverage

Tests should cover:

- provider config resolution
- provider selection and fallback policy
- Genvid health check behavior
- request mapping from Hermes task to Genvid payload
- successful task polling and artifact mirroring
- timeout and failure handling

### Integration coverage

Tests should verify:

- `video.generate_mp4` prefers Genvid when enabled and healthy
- fallback path still works when Genvid is unavailable
- artifact registration remains compatible with current workspace cards

### Verification commands

The repository should still pass:

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

If local managed startup is implemented in this phase, there should also be a documented manual smoke test for starting the imported Genvid API and creating a real video task from the workspace.

## Implementation Sequence

1. Import the required Genvid runtime folders into a dedicated repository-local integration directory.
2. Add typed Genvid config and client adapters in `lib/hermes/video/`.
3. Add tests for provider selection, health checks, request mapping, polling, and fallback behavior.
4. Update `ToolExecutor` so `video.generate_mp4` routes through the Genvid provider first.
5. Mirror Genvid output files into local artifacts and register them through the existing task manager path.
6. Add environment variable documentation and any required startup notes.
7. Run full verification.

## Risks

### Python dependency weight

Importing Genvid increases repository size and adds Python runtime dependencies. Keeping the subsystem isolated reduces the impact.

### Service lifecycle complexity

Auto-starting and monitoring a Python API from a Node environment adds operational complexity. This is why `connect_only` must remain supported.

### Output path mismatches

Genvid serves files from its own output directory, while `AI ASSISTENT` expects artifacts in `public/artifacts`. The adapter must mirror files locally instead of assuming shared paths.

### Partial configuration

Genvid supports many advanced workflows. The first integration must prefer stable defaults rather than exposing every control immediately.

## Success Criteria

This work is successful when:

- the repository contains a repository-local imported Genvid engine boundary
- `AI ASSISTENT` remains the only main user-facing workspace
- `video.generate_mp4` uses the imported Genvid provider when enabled and healthy
- completed Genvid videos appear as local workspace artifacts
- failures degrade clearly and safely
- the existing repository verification commands still pass
