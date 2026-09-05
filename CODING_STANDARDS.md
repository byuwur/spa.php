# Coding standards

**Simple is complicated enough.**

The aim is maximum clarity and maintainability for the minimum justified complexity. Complexity is a budget to spend on solving the problem, not evidence of sophistication.

**Local simplicity is not enough if several simple components create competing system-level ownership or hidden state rules.**

## Authority and scope

This document is the canonical engineering policy. [CONTRIBUTING.md](CONTRIBUTING.md) describes the contribution workflow; [AGENTS.md](AGENTS.md) orients automated contributors. Neither duplicates nor overrides this policy.

Resolve conflicts in this order:

1. Explicit repository or project requirements, including the authorized task scope.
2. This document.
3. Established local conventions.
4. General language and ecosystem conventions.

Existing public contracts take precedence over aesthetic consistency. Record intentional local departures from this standard where contributors will find them. Do not silently “correct” them.

## 1. Engineering identity and simplicity

Prefer direct control flow, explicit behavior, guard clauses, operational transparency, and low integration and deployment cost. Use language-native conventions, plain data formats where appropriate, and abstractions small enough to understand in context. Owning a small piece of infrastructure is reasonable when it reduces total maintenance cost. Remove mechanisms whose justification has disappeared.

Simplicity means:

> **The minimum number of concepts necessary to correctly understand, modify, test, and operate the behavior.**

Fewer lines or files do not necessarily mean fewer concepts. More abstractions do not necessarily improve architecture. Productive verbosity makes decisions visible; readable duplication can preserve locality. A long, cohesive function or module may be easier to maintain than a chain of small functions that must always be read together.

Distinguish essential complexity imposed by the problem from accidental complexity introduced by the implementation. Evaluate the whole workflow, including failures and operation, rather than only the code being edited.

## 2. Make abstractions earn their existence

Prefer improvements in this order:

1. Delete unnecessary code.
2. Simplify existing code.
3. Clarify an invariant, contract, or name.
4. Reuse an existing appropriate implementation.
5. Extract a small helper.
6. Reorganize an existing module.
7. Add a new abstraction.
8. Add a dependency or architectural layer.

The further down this list a change goes, the stronger its justification must be. Explain the concrete problem and why a simpler option is insufficient. Do not build extension mechanisms for imagined requirements.

Similar syntax does not establish shared responsibility. Duplication can be appropriate when behavior changes independently, belongs to different hosts, has meaningful differences, or costs less to maintain than a shared dependency. Extract common policy when duplicated decisions must remain consistent and a small shared implementation makes that responsibility clearer.

## 3. Give system decisions one owner

Each system-level decision needs one authoritative owner. This applies to navigation, persistence, cache policy, autosave, lifecycle transitions, cleanup, recovery, asynchronous coordination, synchronization, and configuration precedence.

Other components may request, observe, transform, display, or enhance behavior. They must not independently enforce a competing version of the same policy. Multiple handlers or entry points are acceptable when their responsibilities compose explicitly.

Before adding a mechanism, identify who already makes the decision, how callers reach that owner, and what happens if two paths act at once. A small local implementation is not simpler if it creates a second coordinator elsewhere.

## 4. Make state authority explicit

For meaningful shared or persistent state, make these answers discoverable in the implementation or a short contract:

- Who owns the state, and who may mutate it?
- Which representation is authoritative, including after partial failure?
- What makes a copy stale, and how is it invalidated or refreshed?
- When is a fallback used, and what takes precedence during recovery?
- Can callers observe an incomplete transition?

> A fallback without an explicit precedence rule is a second source of truth.

Calling something a “single source of truth” is insufficient unless its authority actually survives the relevant transitions. Do not assume that successful reads imply successful writes, or that a cached success means the underlying operation completed.

Keep related state changes coherent. Use transactions, atomic replacement, version checks, or simpler serialization when the actual failure or concurrency model requires them. Avoid machinery that protects against no supported scenario.

## 5. Define lifecycle and asynchronous behavior

Every continuing mechanism needs an owner, a creation point, a useful lifetime, and an end condition. Timers, handlers, registrations, caches, requests, pending writes, and temporary resources must be disposed of, canceled, superseded, invalidated, or deliberately ignored when no longer relevant.

Object scope and garbage collection do not establish application lifetime. A registry can keep obsolete work reachable; a completed request can update a view that no longer owns its result.

Make ordering and overlap policy explicit: whether work is serialized, merged, replaced, or allowed concurrently. Use the smallest adequate mechanism, such as a generation counter or an existing cancellation facility. Cancellation does not undo effects already issued; prevent stale completion from committing state where necessary.

## 6. Organize by responsibility

Give functions and modules a responsibility that can be described without listing unrelated tasks. Keep dependencies and side effects visible at the level where they are coordinated.

Do not impose arbitrary line limits. A parser, algorithm, workflow, or state machine may remain cohesive at substantial length. Split when parts have different owners, lifecycles, dependencies, trust boundaries, testing needs, or reasons to change. Name the conceptual boundary before creating a new file.

Keep helpers near their consumers until broader reuse is real. Avoid utility modules that collect unrelated behavior merely because it lacks another home. Combine fragments when separation adds navigation without clarifying responsibility.

## 7. Keep control flow and naming readable

Validate preconditions early. Prefer guard clauses, explicit branches, visible failure paths, and understandable state transitions. Use concise expressions when their meaning is immediate; expand them when they conceal mutation, ordering, or failure behavior.

Follow the language and surrounding code for casing, prefixes, constants, and parameter conventions. Semantic consistency matters more than identical spelling across languages. Names should communicate the relevant action, responsibility, ownership, state, units, or context.

Rename when a name misleads, hides an important distinction, or makes related contracts difficult to recognize. Preserve established public names unless the benefit justifies migration. Avoid mass cosmetic renaming and prefixes that add no useful information.

## 8. Keep APIs small and contracts precise

Every public function, option, event, configuration setting, and supported format is a maintenance obligation. Expose what callers need, and make the internal boundary recognizable.

Define accepted inputs, defaults, return values, side effects, mutation, and failure behavior. Distinguish missing, empty, null, false, invalid input, and operation failure wherever callers need that distinction. Keep equivalent operations consistent; explain necessary differences.

Add options for real variation, not to avoid deciding who owns behavior. Boolean switches and fallback combinations can create a large implicit state machine behind a small signature. Prefer fewer supported combinations with clear contracts.

Evolve APIs deliberately. Preserve behavior during refactoring. A requested bug correction may change defective behavior, but identify any observable compatibility impact rather than treating it as incidental cleanup.

## 9. Make errors and recovery understandable

Choose failure semantics appropriate to the boundary: return a result or sentinel, throw or reject, terminate, or present an error. Do not silently alternate between incompatible forms. Document cases callers must distinguish.

Catch errors where the code can recover, add useful context, translate the contract, or report the failure to its owner. Do not convert failure into success-shaped data or empty results without a defined reason. Keep logs useful without exposing sensitive information or reporting the same failure repeatedly at every layer.

Retry only when the failure is plausibly transient and repeating the operation is safe. An ambiguous failure may follow a successful side effect. Non-idempotent operations need an explicit duplicate-prevention or reconciliation strategy before automatic retry.

## 10. Enforce real trust boundaries

Validate where data crosses a trust boundary, before granting it the capabilities of the receiving context. Keep parsing, validation, and output encoding distinct. There is no universal sanitizer: safe text in one context may be executable or structurally meaningful in another.

Use safe defaults, allowlists where appropriate, prepared operations, resolved-path containment, least capability, and established cryptographic facilities. Apply authentication and authorization at the boundary that performs the action; use session and request-forgery protections where the application model requires them.

Bound input size, decoded or expanded resources, processing time, and recursion where untrusted input can exhaust resources. Preserve enough error context to diagnose rejected input without exposing secrets or internal resources.

Distinguish a demonstrated vulnerability from a plausible risk and optional hardening. Choose controls for realistic exposure and consequences. Added security machinery must reduce an actual risk enough to justify its operational and maintenance cost.

## 11. Choose dependencies and compatibility deliberately

Assess a dependency by total benefit against conceptual, maintenance, update, security, deployment, compatibility, and build costs. A well-chosen dependency can be simpler than owned infrastructure. Do not reimplement complex, specialized, or security-sensitive behavior merely to avoid dependencies; do not add a large dependency for a small, stable operation that is clearer locally.

Compatibility should protect real supported APIs, stored data, deployment environments, integrations, and formats. Document the supported scenario and the reason for non-obvious branches. Retire obsolete compatibility deliberately, with migration guidance when needed. Speculative compatibility is another mechanism to maintain.

## 12. Keep equivalent paths equivalent

Equivalent entry paths must satisfy the same contract: initial and later execution, direct and indirect calls, normal and recovery paths, primary and fallback storage, or corresponding frontend and backend behavior. Any intentional difference must be explicit.

Independent runtimes may remain independent. Do not introduce a package or shared architecture solely to eliminate copied text. For behavior that must match across modules or projects, use shared fixtures, parity checks, compatibility tables, or reproducible version pins as appropriate. Make the canonical owner of mirrored policy and the update path discoverable.

Test the actual entry points. A handwritten imitation of the implementation can pass while the real path diverges. When shared code changes, check integrations and copied initialization or configuration that a dependency update does not replace.

## 13. Fix invariants and test actual risks

For a bug, identify the invariant that failed, reproduce the failure, check the nearest opposite or boundary case, and fix the owner of that invariant. Inspect adjacent transitions and equivalent entry paths before declaring the repair complete. Add a practical regression test and update the contract where clarification is needed.

Choose tests for confidence, not count or coverage percentage. Prioritize public contracts, historical regressions, state transitions, lifecycle cleanup, trust boundaries, failure and recovery behavior, compatibility, and integration between owners.

Prefer the smallest suite that distinguishes correct behavior from plausible mistakes. Use focused unit tests for isolated rules and a few integration tests for wiring and real entry paths. Source checks can supplement execution; they do not establish runtime correctness. Avoid tests that merely restate the implementation.

Use the repository's actual validation tools and documented workflows. Run checks appropriate to the change and any required checks. Broaden testing when changes, failures, or unresolved risks justify it. Report blocked, skipped, and unexecuted checks distinctly from passing checks; do not present an environmental limitation as a code failure.

## 14. Comment the decisions; document the contracts

Comments should preserve information the code cannot easily convey: intent, invariants, ownership, lifecycle, trust assumptions, compatibility reasons, protocol requirements, ordering constraints, surprising choices, and intentional deviations.

Avoid narrating obvious syntax, decorative verbosity, and comments that compensate for misleading names. A short explanation of why an unusual branch exists is more valuable than a paragraph describing each statement. Inaccurate comments are worse than absent ones.

Public API documentation should describe accepted inputs, defaults, outputs, failures, side effects, mutation, and relevant trust, lifecycle, and compatibility constraints. Use the documentation conventions appropriate to the language and project. Internal helpers need only the detail their callers cannot reasonably infer.

Code and documentation describe the same contract. Inspect both when changing behavior, including examples and configuration guidance. Do not preserve a polished explanation of behavior the implementation no longer provides.

## 15. Measure performance; bound resource use

Prioritize correctness, then clarity, then measurement, then optimization. Take obvious improvements when they preserve clarity, but justify complex caching, concurrency, or specialized representations with observed costs or a concrete capacity requirement.

Resource bounds are part of correctness when input can exhaust memory, storage, connections, or processing time. A small encoded input can expand into a large workload. Evaluate the resource actually consumed, not only the convenient size available at the boundary.

## 16. Refactor to reduce concepts

A refactor succeeds when ownership, contracts, state, or testability become easier to understand without unintended behavior changes. It may add lines, split or combine modules, or delete an abstraction. Explain the reduction in conceptual burden rather than appealing to architectural fashion.

Separate unrelated refactoring and broad formatting from behavior changes. Keep a necessary refactor close enough to its motivating change that reviewers can understand the connection. Preserve public behavior unless a change is authorized and its compatibility consequences are addressed.

## 17. Review the final implementation

Before considering a change complete, read the resulting behavior and diff together:

- Is there one owner for the decision, with a defined lifetime and invariant?
- Do equivalent entry paths and adjacent state transitions still agree?
- Did a fallback, cache, or helper introduce another source of truth?
- Did each abstraction and dependency earn its cost?
- Are public behavior, documentation, and meaningful validation aligned?
- Can anything added now be deleted or simplified without losing the result?

Review integration as well as the edited functions. State validation limits honestly.

## 18. Commit standard

Use:

```text
[Type] Area: concrete behavior change
```

Use a specific area and a subject that remains useful years later. The primary types are:

| Type | Use |
| --- | --- |
| Feature | Add supported behavior. |
| Fix | Correct defective behavior. |
| Refactor | Improve structure while preserving behavior. |
| Security | Correct or strengthen a concrete security boundary. |
| Test | Change validation without changing production behavior. |
| Docs | Change documentation. |
| Update | Maintain dependencies, tooling, or other existing support. |
| Breaking | Intentionally change a supported public contract incompatibly. |

Reserve `Hotfix` for an urgent regression in released behavior, not routine fixes, cleanup, or formatting. `DX` is optional when developer experience is the primary outcome and the main types describe it poorly.

For example:

```text
[Fix] Storage: preserve the last valid document when replacement fails
[Refactor] Navigation: centralize transition ownership
[Docs] Configuration: explain fallback precedence
```

Commit one conceptual outcome, including its implementation, tests, and documentation. File count does not determine scope. Separate broad formatting and unrelated maintenance. For dependency or mirrored-code updates, identify the relevant consumer benefit or compatibility effect.

Avoid subjects that say only “Update,” “Tweaks,” “Changes,” “Final,” “Fix stuff,” or “Format.” Add a body when needed to explain intent, compatibility or migration, validation limits, or a non-obvious decision. No additional commit tooling or ceremony is required.

## 19. AI-assisted implementation

Human and automated contributions have the same accountability. Generated code must fit the existing architecture and carry evidence for its behavior.

Before changing significant behavior, inspect the implementation and relevant utilities, identify the owner and invariants, and understand existing contracts. Modify or delete existing mechanisms before replacing them. Preserve established public behavior unless its change is explicitly authorized.

Avoid speculative generalization, casual dependencies, and generated layers whose purpose cannot be explained concretely. Add meaningful tests and documentation where needed, run the existing validation workflow, and review the final diff for integration errors and removable complexity. Report what was verified and what remains uncertain.

> **Do not make the code look more sophisticated than the problem requires.**

> **Before adding something, check whether deleting or simplifying something solves the same problem.**

> **Do not introduce an abstraction merely because several lines look similar; determine whether they represent the same responsibility.**

> **A locally simple implementation is not acceptable if it creates competing system-level ownership.**

## 20. Complexity decision test

1. What concrete problem requires this mechanism?
2. Can deletion, simplification, or appropriate reuse solve it first?
3. Who owns the decision and state, and when does their authority end?
4. Does this reduce the concepts needed across the whole system, or merely move complexity out of sight?
5. Can another maintainer explain, test, change, and operate the result without reconstructing hidden rules?
