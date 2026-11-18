<!--
  File: AGENTS.md
  Desc: Orients automated contributors to the repository guidance and task workflow.

  Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
-->

# Agent instructions

Use the context already available when it is sufficient for the task. When more context is needed, consult the relevant sections in this order.

1. [README.md](./README.md).
2. [CODING_STANDARDS.md](CODING_STANDARDS.md).
3. [CONTRIBUTING.md](CONTRIBUTING.md).
4. Relevant project-specific documentation and the existing implementation, callers, and tests. For framework changes, read its documented application layout and runtime contracts where available.

`CODING_STANDARDS.md` is the canonical engineering policy. Start with the active repository's guidance and use the corresponding `.codex` guidance to fill gaps. Disclose any material uncertainty that remains.

Current user instructions and authorized scope take precedence over saved preferences. Memory and skills are derived reminders: verify them against the current repository guidance and implementation before relying on details that may have changed. When a memory update is requested, retain durable decisions and their source references; distinguish them from temporary exceptions and historical results.

## Work within the requested scope

- For direct maintainer requests in the current checkout, work on its current branch and proceed within the agreed scope.
- Inspect the existing architecture, nearby utilities, and callers before adding a replacement. Identify the responsible owner, invariant, state authority, and lifecycle before changing behavior.
- Check Git status before editing or staging. Preserve unrelated and concurrent work; use an external snapshot when a broad pass or partial staging warrants one.
- When shared behavior changes, check relevant sibling implementations and framework callers for parity by default. Preserve independent contracts and intentional project differences, and keep edits within the agreed scope.
- Prefer deleting, simplifying, or reusing existing code. Justify any new abstraction or dependency with a concrete need.
- Incorporate related follow-ups and corrections into the active task and complete them with the original request. Resume interrupted work from the established checkpoint.
- Follow the [commit standard](CODING_STANDARDS.md#18-commit-standard). Create commits only when the current task authorizes them; pushing requires separate authorization.

## Edit and validate authored source

Work on authored source. Exclude minified/generated files, bundles, vendored code, installed modules, and submodule contents from bulk edits. Coordinate a dependency change in its owning repository when that is within scope. Updating an import URL does not require editing the referenced generated asset.

Preserve existing formatting, section order, encoding, line endings, and tool annotations unless their change is part of the task. Keep unrelated formatting separate from behavior changes.

Use existing documentation and test files first. Create additional documentation or test files only when explicitly requested or genuinely necessary.

Run [focused checks](CODING_STANDARDS.md#13-fix-invariants-and-test-actual-risks) for the changed behavior and any project-required checks. Review the complete diff and affected integration paths. Report the results and material limitations.

Never create `.agents/`, `.codex/`, or similar agent folders inside project repositories. Keep agent configuration, skills, plugins, hooks, scratch scripts, and temporary validation fixtures outside repositories.

## Communicate and finish

Be concise and execution-focused. Proceed with reasonable assumptions and ask questions only when missing information is required to continue correctly. Keep routine narration out of the response; provide updates when a meaningful finding, decision, or blocker needs attention.

For ordinary tasks, report only:

- What changed.
- Whether the work and relevant validation succeeded.
- Any critical caveat or required action.

> **Do not make the code look more sophisticated than the problem requires.** SIMPLE IS COMPLICATED ENOUGH.
