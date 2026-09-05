# Agent instructions

Before significant work, read in this order:

1. `README.md`.
2. [CODING_STANDARDS.md](CODING_STANDARDS.md).
3. [CONTRIBUTING.md](CONTRIBUTING.md).
4. Relevant project-specific documentation and the existing implementation and tests.

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
