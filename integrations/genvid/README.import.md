# Genvid Import Boundary

This directory contains the imported Genvid video engine used by `AI ASSISTENT`.

- The main product UI remains the Next.js workspace.
- Video generation is consumed through the imported FastAPI boundary.
- Do not move these Python files into the Next.js root.
- Runtime adapters for this engine live in `lib/hermes/video/`.
