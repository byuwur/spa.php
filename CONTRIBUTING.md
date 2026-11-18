<!--
  File: CONTRIBUTING.md
  Desc: Describes the contribution workflow and validation expectations.

  Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
-->

# Contributing

Contributions that solve real problems, improve usability, clarify behavior, or simplify maintenance are welcome. Keep the work focused, understandable, and verifiable.

Use [README.md](README.md) for project setup and [CODING_STANDARDS.md](CODING_STANDARDS.md) for engineering policy. This guide covers contributions submitted for review. For direct work in the maintainer's checkout, see [AGENTS.md](AGENTS.md). Follow any explicit repository requirements, templates, and supported environments.

## Report a problem or propose a change

Check existing issues, pull requests, and documentation before opening a new discussion. For a bug, include:

- The version or revision and relevant environment.
- Minimal steps or input that reproduce the problem.
- Expected behavior and what actually happened.
- Relevant logs, screenshots, or a small failing example, with private data removed.

For a feature, explain the user need, a concrete example, and the limits of the proposed change. For substantial architecture changes, new dependencies, or incompatible behavior, agree on scope with maintainers before investing in a large implementation. Small, focused fixes and documentation improvements can go directly to a pull request.

Use the repository's private reporting channel for security-sensitive details when one is provided; otherwise contact a maintainer privately before posting those details publicly.

## Prepare your contribution

Read the relevant implementation, callers, tests, and project documentation. Understand the current behavior and available helpers before replacing them. Check the working tree and preserve unrelated changes.

When working outside the maintainer's checkout, use your own fork or a contribution branch permitted by the repository workflow. Follow the documented setup and reuse the existing toolchain and validation tools. Propose additions only when a concrete requirement makes them necessary.

## Make one coherent change

Keep each contribution centered on a concrete outcome. Prefer deleting, simplifying, or reusing code before adding another mechanism. Explain the need for a new abstraction or dependency and its maintenance cost.

Preserve public APIs, data formats, defaults, and supported integrations unless a change to them has been agreed. Make intentional compatibility changes explicit and explain migration requirements. Include affected callers and examples when needed to keep the result usable.

Keep unrelated formatting, renaming, and cleanup out of the change. Preserve existing encoding, line endings, and necessary tool annotations. Edit authored source; leave generated/minified assets, bundles, vendored code, installed dependencies, and submodule contents out of routine changes. Follow an explicit project regeneration or dependency-update workflow when one is required.

Respect existing copyright and attribution notices. Identify the source and license of any proposed third-party addition so maintainers can review it.

## Verify behavior and update documentation

Use the README, scripts, and CI configuration to find focused checks for the changed behavior and any project-required checks. Establish the relevant baseline when practical. Follow the [regression coverage guidance](CODING_STANDARDS.md#13-fix-invariants-and-test-actual-risks) for behavioral fixes.

For interface changes, check keyboard operation, focus, supported themes, responsive layouts, and related states where affected. Include before/after images when they help reviewers assess the result. For performance claims, provide a reproducible comparison and describe the workload and environment.

Distinguish a product regression from an outdated assertion or a setup/network failure. Do not weaken checks merely to get a passing result. Record the exact commands run, their results, and anything skipped or blocked. Local fixtures do not prove that an external service or unpublished release is available.

Update existing documentation, configuration examples, and integration samples when a public contract changes. Keep explanations useful and concise; avoid duplicating behavior already obvious from the interface. Create new documentation or test files when they are needed, rather than by default.

## Keep commits reviewable

Follow the [commit standard](CODING_STANDARDS.md#18-commit-standard) for message format, scope, and ordering. Coordinate version, dependency, and release changes with maintainers and follow the [release reference rules](CODING_STANDARDS.md#22-versions-and-release-references).

## Open a pull request

Use a title that describes the resulting change. In the description, explain:

- The problem, intended behavior, and issue or discussion link if one exists.
- The scope of the solution and any important tradeoff.
- Compatibility, migration, dependency, or release implications.
- Validation performed, results, and remaining limitations.

Use a repository template when provided. Describe the final implementation, rather than a transcript of the work. Open a draft if the scope or implementation still needs discussion, and make its incomplete parts clear.

You are responsible for understanding and reviewing everything you submit, including code produced with generators or AI tools. Assistants should follow [AGENTS.md](AGENTS.md), stay within the agreed scope, and report verification accurately. Review their changes as carefully as your own and apply the same standards to all contributions.

## Work through review

Keep discussion respectful and focused on the code, evidence, and user impact. Respond to feedback with concrete explanations or focused changes. If a suggestion conflicts with a supported contract, explain the conflict and discuss an alternative. Re-run affected checks after revisions and keep the pull request description current.

Keep the contribution history understandable. Coordinate history rewrites when others have reviewed or contributed to the branch. Follow repository permissions for shared branches; a pull request does not authorize merging, publishing a release, or changing project settings.

Maintainers may request a smaller scope or decline a change whose maintenance cost outweighs its benefit. The goal is a result another person can understand, verify, and maintain.

Before requesting final review:

- [ ] The contribution has a clear outcome and no unrelated changes.
- [ ] Existing contracts and affected integration paths were checked.
- [ ] Relevant tests and documentation match the final behavior.
- [ ] Validation results and limitations are stated accurately.
- [ ] New dependencies or compatibility changes have been discussed where necessary.
- [ ] The complete diff and commit progression have been reviewed.

**Simple is complicated enough.**
