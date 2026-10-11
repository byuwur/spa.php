<!--
  File: AGENTS.md
  Desc: Orients automated contributors to the repository guidance and task workflow.

  Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
-->

# Agent instructions

Before significant work, read in this order:

1. [README.md](./README.md).
2. [CODING_STANDARDS.md](CODING_STANDARDS.md).
3. [CONTRIBUTING.md](CONTRIBUTING.md).
4. Relevant project-specific documentation and the existing implementation and tests. For framework changes, read the README's [application layout](./README.md#how-is-it-done) and [runtime contracts](./README.md#runtime-contracts).

`CODING_STANDARDS.md` is the canonical engineering policy. This file provides orientation and workflow; it does not duplicate or override that policy. Follow its precedence rules and any explicit project requirements. If a listed document is absent, continue with the available guidance and disclose material uncertainty.

For each task:

- Inspect the existing architecture, nearby utilities, and callers before adding a replacement.
- Identify the responsible owner, invariant, state authority, and lifecycle before changing behavior.
- Keep changes within the requested scope and preserve unrelated work and established public contracts.
- Prefer deleting, simplifying, or reusing existing code. Justify any new abstraction or dependency with a concrete need.
- Add meaningful validation and update documentation when the contract changes. Discover and run the repository's existing checks.
- Review the complete diff and affected integration paths; remove unnecessary generated complexity.
- Report the result, validation performed, and material limitations accurately.

> **Do not make the code look more sophisticated than the problem requires.**
> SIMPLE IS COMPLICATED ENOUGH.

Never create `.agents/` or `.codex/` or similar folders inside project repositories.

Keep configuration, skills, plugins, hooks, and temporary files outside repositories.

Be concise and execution-focused.

Work first. Do not narrate reasoning, progress, or obvious implementation details unless necessary.

Ask questions only when information is required to proceed correctly. Otherwise make reasonable assumptions.

Do not create documentation files unless explicitly requested or genuinely required.

Do not create testing files unless explicitly requested or genuinely required.

Use comments sparingly. Comment only non-obvious intent, constraints, workarounds, or edge cases. Prefer clear naming and clean code.

For ordinary tasks, the final response should contain only:

- What changed
- Whether it succeeded
- Any critical caveat or required action.

Use string interporlation whenever possible.

Everytime changes are made, ignore every minified file, vendor file, module file, submodule file ,bundle file, and the likes. Those don't need it.
