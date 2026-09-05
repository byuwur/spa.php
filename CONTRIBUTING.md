# Contributing

[CODING_STANDARDS.md](CODING_STANDARDS.md) is the canonical engineering policy. This document describes how to prepare and submit a contribution.

## Before changing code

Read `README.md`, the coding standards, and relevant project documentation. Inspect the nearby implementation and tests, including existing helpers and the paths that call the behavior. Understand the requested outcome and current contract before proposing architectural changes.

Check repository-specific requirements and preserve unrelated work. If the implementation differs intentionally from a general convention, understand the reason before changing it.

## Make a focused change

Keep the contribution centered on one conceptual outcome. Preserve public contracts unless changing them is part of the agreed scope. Include the tests and documentation needed to explain and validate that outcome.

Avoid unrelated formatting, refactoring, and dependencies. When restructuring is necessary, explain how it makes the requested behavior easier to understand or maintain.

## Validate and document

Discover validation commands from the repository's documentation, scripts, and CI configuration. Use the existing workflow rather than assuming commands from another project.

Run relevant and required checks. For behavior changes, choose meaningful tests that exercise the affected contract and important boundary or failure cases. Report checks that were skipped, blocked, or not run, with the reason.

Update documentation when public behavior, configuration, defaults, compatibility, or failure semantics change. Review examples as well as API descriptions.

## Commit and request review

Follow the commit standard in [CODING_STANDARDS.md](CODING_STANDARDS.md#18-commit-standard). Keep implementation, regression tests, and related documentation together when they form one outcome.

A review description should explain what changed, why it was needed, any compatibility or migration effects, and how it was validated. Name remaining uncertainty without treating unexecuted checks as successes.

Before submitting:

- [ ] The change addresses the requested outcome without unrelated work.
- [ ] Ownership, state transitions, and affected entry paths were checked.
- [ ] Public contracts are preserved or intentional changes are explained.
- [ ] Relevant tests and documentation reflect the final behavior.
- [ ] Validation results and limitations are recorded.
- [ ] The final diff was reviewed for mistakes and unnecessary complexity.
