# Workspace Tool Enablement And Dummy Purge

## Overview

This spec upgrades the AI ASSISTENT workspace so every tool family exposed by the UI reflects real runtime capability and no production path depends on dummy, mock, or synthetic execution data.

The current workspace already has the right shell:

- a Hermes-style task orchestration layer
- approval-aware workspace state
- artifact persistence and download surfaces
- capability and output type metadata

The gap is reliability. Some tool families are fully wired, while others still depend on seed data, simulated execution, stub executors, or mock attachments. That makes the website look more complete than it really is.

The goal of this work is to make the system honest and usable:

- tool families that are truly supported must work end-to-end
- tool families that are only partially supported must degrade honestly
- production UI must no longer be driven by dummy data
- artifact downloads must always point to real generated files

This work must preserve the existing workspace shell, chat flow, approval behavior, and task/project UX.

## Goals

- Enable all existing tool families in the workspace to use real runtime paths wherever the project already has enough infrastructure.
- Remove dummy, mock, and simulated production data from runtime-facing UI flows.
- Align capability metadata, task routing, execution status, and artifact output so they describe the same truth.
- Preserve the current system structure instead of rewriting the workspace.
- Keep the project passing tests, lint, typecheck, and build.

## Non-Goals

- Rebuilding the chat UI or workspace shell from scratch.
- Replacing the current Hermes-inspired orchestration model.
- Introducing a new third-party execution platform as the primary runtime contract.
- Faking support for tool families that still lack a real backend path.

## Supported Tool Families

This spec covers all tool families already represented by the workspace UI and capability model, especially:

- Slides
- Documents
- Images
- Sheets
- Websites
- Videos
- Other output families already exposed through the workspace catalog and output-type picker

Each family must end up in one of these states:

- `ready`: supported end-to-end in the current project
- `needs_setup`: supported by code shape but blocked on missing config or missing provider integration
- `unavailable`: not yet implemented enough to be used safely

No family may remain implicitly treated as `ready` through dummy seeds or simulated execution.

## Current Problems

### Runtime truth is inconsistent

The runtime currently mixes real execution with simulation and fallback artifact synthesis. This allows tasks to appear successful even when a tool path is not truly implemented.

### Workspace UI can still be influenced by dummy data

Parts of the workspace still seed mock capabilities, mock attachments, mock templates, or placeholder recommendations. That makes the UI look operational before the runtime has proved it.

### Capability metadata is too optimistic

Output-type lists and catalog entries include tool families that the executor cannot yet fulfill consistently.

### Fallbacks are misleading

Some fallback behavior produces synthetic artifacts or optimistic task states instead of reporting that a capability needs setup or is unavailable.

## Design Principles

### Preserve current structure

The workspace shell, task cards, approval flow, and project navigation stay in place. The main changes happen in runtime and state wiring.

### One source of truth

Capability availability must be computed from a single capability registry and surfaced consistently to:

- prompt composer
- workspace context
- planner/task resolver
- executor
- task detail cards
- artifact downloads

### Honest degradation

If a tool family lacks execution support, the system must return a truthful status and explanation instead of simulating success.

### Artifact-first completion

A task that claims output success must provide at least one real artifact or a real execution result that can be persisted and downloaded.

## Target Architecture

### 1. Capability Registry

The capability registry becomes the canonical truth for:

- tool family identity
- output types supported by that family
- runtime status
- setup requirements
- display label and category metadata

This replaces optimistic seed-driven capability exposure.

Each capability entry must define:

- `id`
- `family`
- `label`
- `supportedOutputTypes`
- `status`
- `requires`
- `executorStrategy`
- `fallbackPolicy`

`fallbackPolicy` may only allow:

- `report_needs_setup`
- `report_unavailable`
- `use_real_artifact_conversion`

It must not allow synthetic success.

### 2. Task Request Resolution

The task request resolver must only route a request to a capability that:

- supports the requested output type
- is `ready`, or
- is `needs_setup` with a clear surfaced reason

If multiple capabilities fit, the resolver should prefer:

1. exact family/output match
2. capability with the most direct executor strategy
3. capability with the fewest missing requirements

If no ready capability exists, the task should fail early with an actionable reason instead of entering simulated execution.

### 3. Tool Executor Strategies

The executor layer must be organized by output family rather than by broad stubs.

Target strategy groups:

- `documents`
- `slides`
- `sheets`
- `images`
- `websites`
- `videos`
- `generic_artifact`

Each strategy must return:

- a real execution summary
- zero or more persisted artifact records
- structured warnings
- structured setup blockers when applicable

The executor must no longer support general-purpose stub handlers such as mock image generation or simulated component builds in production paths.

### 4. Artifact Pipeline

Artifact persistence remains in the existing artifact storage shape, but with stricter rules:

- every persisted artifact must map to a real generated file
- artifact metadata must identify origin strategy and output type
- download items must only reference files that exist
- failed generation must not leave a successful artifact shell behind

### 5. Workspace State Bridge

`workspace-context` remains the UI bridge, but its data must come only from live runtime state and capability truth.

It must stop seeding:

- mock skills that represent production-ready features
- mock templates that imply live generation support
- mock attachments used as normal user actions

Development-only fixtures may remain under test-only paths, but they must not affect production UI state.

## Tool Family Behavior

### Slides

Requests for slide output must produce a real `.pptx` artifact or a valid presentation output artifact that the current runtime already knows how to persist and download.

If no slide generator is fully available, the system must mark slides as `needs_setup` or `unavailable` and explain the blocker.

### Documents

Document requests must produce real `pdf`, `docx`, `txt`, or `md` outputs through the document execution path and artifact persistence.

Synthetic files or simulated success messages are not acceptable.

### Images

Image requests must either:

- generate or transform a real image file, or
- report that image generation needs setup

Mock image output handlers must be removed from production flow.

### Sheets

Sheet requests must produce real spreadsheet artifacts such as `xlsx`, `csv`, or structured tabular outputs that are persisted and downloadable.

### Websites

Website requests must produce real `html` or `zip` artifacts, with metadata that identifies the website/export output family.

### Videos

Video capability must be treated most strictly. If the project lacks a real generator path, the UI must not present it as ready. It can remain visible as a known family, but only as `needs_setup` or `unavailable`.

No synthetic `mp4` success path is allowed.

## Dummy Data Purge

The purge covers all runtime-facing dummy data in production code:

- mock skills and seeded fake capability state
- mock templates and placeholder recommendations that imply live support
- mock attachment add flows in the prompt composer
- simulated execution branches in the orchestrator
- stub executor commands in the runtime
- fake success artifact builders

Allowed test data after this change:

- test fixtures under `tests/`
- narrowly-scoped helper fixtures used only in unit tests
- optional dev fixtures that are gated away from production runtime and UI

## Error Handling

Every failed task must return a safe structured reason. The allowed user-facing failure classes are:

- unsupported output type
- capability unavailable
- capability needs setup
- execution failed
- artifact persistence failed

Each failure should include:

- a short user-safe message
- a machine-readable code
- optional setup guidance when relevant

Internal stack traces, secrets, or provider-specific raw errors must not surface directly to the workspace UI.

## Testing Strategy

### Automated verification

The following command set must pass after implementation:

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

### Unit and integration coverage updates

Tests must be updated or added for:

- capability registry truth
- request resolution for each major output family
- executor rejection of unavailable/stub-only capabilities
- artifact persistence with real metadata
- workspace context behavior without mock production state
- UI handling of `ready`, `needs_setup`, `unavailable`, `failed`, and `completed`

### Manual verification

Manual smoke tests must confirm end-to-end behavior for:

- Slides output
- Documents output
- Images output
- Sheets output
- Websites output
- Video capability status handling

## Implementation Sequence

1. Audit and classify every runtime-facing dummy/stub/mock path.
2. Replace executor stubs with family-based real strategy routing.
3. Tighten task request resolution to capability truth.
4. Align artifact persistence and download metadata.
5. Remove production dummy seeds from workspace state and composer flows.
6. Update UI states to reflect real capability availability.
7. Update tests.
8. Run full verification.

## Risks

### Capability exposure may shrink before it grows

Once dummy data is removed, some tool families may initially appear less available. This is expected and preferable to false success.

### Existing tests may depend on optimistic behavior

Tests written against simulated execution will need to be rewritten around truthful runtime outcomes.

### Video support may remain setup-gated

Video is the most likely family to remain non-ready if the project does not already contain a real generation path. This is acceptable as long as the UI and runtime present that truth clearly.

## Success Criteria

This project is successful when:

- no production execution path depends on dummy or simulated success
- every visible tool family has an honest runtime status
- supported tool families produce real persisted artifacts
- unsupported families fail safely and clearly
- the workspace still uses the existing shell and interaction model
- the repository passes test, lint, typecheck, and build
