---
name: tdd
description: Apply an explicit test-driven development workflow using small red-green-refactor slices and behavior-focused tests. Use when the user asks to work test-first, requests TDD, or mentions red-green-refactor. Do not trigger merely because the user asks for tests after an implementation already exists.
---

# Test-Driven Development

Use TDD as a feedback loop, not as a ceremony. Work in small vertical slices and keep the code runnable after each cycle.

When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

Before changing code:

1. Find the repository's existing test framework, commands, and conventions.
2. Run the narrowest relevant tests to establish a baseline.
3. Identify the observable behavior and the interface through which it should be tested.
4. If the correct test seam is materially ambiguous or choosing it changes architecture, recommend one and confirm it with the user. If it is obvious from existing code, state the assumption and continue.

For legacy code with no practical test seam, first add the smallest useful characterization test. Do not force a large redesign merely to begin TDD.

## What a good test is

Prefer tests that verify behavior through stable interfaces rather than implementation details. A good test reads like a specification, fails for a meaningful reason, and usually survives internal refactors.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Seams — where tests go

A **seam** is a place where behavior can be observed or substituted. Prefer the highest stable seam that gives useful feedback without making the test slow, flaky, or opaque.

Do not ask for confirmation before every test. Confirm only when the seam is a meaningful design decision; otherwise follow the repository's established test shape.

Ask: "What's the public interface, and which seams should we test?"

## Anti-patterns

- **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
- **Premature horizontal slicing** — writing a large speculative suite before learning from implementation. Prefer vertical slices: one behavior → one failing test → one minimal implementation → refactor. A small table of closely related cases is fine when it describes one understood behavior.

## Rules of the loop

- **Red.** Write a test that fails for the expected reason. If it passes immediately, verify that it can detect the missing behavior.
- **Green.** Make the smallest coherent change that passes the new test without knowingly breaking existing behavior.
- **Refactor.** Improve names, structure, duplication, and interfaces while keeping all relevant tests green. Do not expand scope or add speculative behavior.
- **Repeat.** Add the next behavior only after the current slice is green and understandable.
- **Verify.** Run the narrow suite during each cycle and the broader relevant checks before completion.
