---
name: improve-codebase-architecture
description: Review a codebase for evidence-backed architecture improvements, compare practical refactoring candidates, and discuss the selected candidate before implementation. Use only when the user explicitly invokes this skill for an architecture review or refactoring assessment.
---

# Improve Codebase Architecture

Review architecture as a context-dependent engineering problem. Use deep-module ideas as one lens alongside cohesion, dependency direction, ownership, change frequency, operability, performance, and testability.

## 1. Choose a useful scope

- Follow a module, subsystem, or pain point named by the user.
- Otherwise inspect a meaningful stretch of `git log --oneline` and changed-file history to identify likely hot spots. Treat change frequency as a clue, not proof of bad design.
- Read applicable `AGENTS.md`, `CONTEXT.md`, `CONTEXT-MAP.md`, and ADRs before recommending changes.

## 2. Inspect the code and tests

Trace real call paths, data ownership, dependency direction, failure handling, and existing tests. Look for evidence such as:

- one behavior requiring coordinated edits across many places;
- interfaces exposing implementation details or unstable dependencies;
- unclear ownership of state or domain decisions;
- pass-through abstractions that add navigation without leverage;
- duplicated policy rather than merely duplicated syntax;
- seams that make important behavior difficult to test;
- modules whose responsibilities change for unrelated reasons.

Also record counter-evidence. A frequently changed or thin module may still be appropriate. Do not recommend a refactor solely because a pattern differs from this skill's preferred vocabulary.

Use `$codebase-design` only when the user wants the deep-module lens or a candidate specifically concerns interface depth and seam placement.

## 3. Present candidates

Present a concise report in the conversation by default. Use a diagram or interactive visualization only when relationships are materially clearer than prose.

For each candidate include:

- **Files** — the concrete files and modules involved;
- **Evidence** — observations from code, history, and tests;
- **Problem** — the maintenance or behavior risk;
- **Options** — at least two viable responses, including leaving the design unchanged when reasonable;
- **Benefits and risks** — expected gains, migration cost, and regression surface;
- **Confidence** — `Strong`, `Worth exploring`, or `Speculative`.

End with one top recommendation and explain why it outranks the alternatives. Do not design a detailed replacement interface yet. Ask which candidate the user wants to explore.

## 4. Explore the selected candidate

After the user selects a candidate:

1. Apply `$grilling` to resolve consequential constraints one at a time.
2. Apply `$domain-modeling` only when domain terminology or a durable architectural decision actually changes.
3. Apply `$codebase-design` when comparing alternative interfaces or seam placement would help.
4. Preserve existing ADRs unless the evidence justifies reopening one; state the conflict explicitly.

Do not implement the refactor unless the user asks for implementation. When implementation is requested, work in small verified steps, preserve behavior, and run the repository's relevant tests and checks.
