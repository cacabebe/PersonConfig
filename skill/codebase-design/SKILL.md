---
name: codebase-design
description: Apply an opinionated deep-module lens to interface and seam design. Use only when the user explicitly invokes this skill, asks for deep-module analysis, or another explicitly selected skill requires this vocabulary. Treat its principles as heuristics rather than universal architecture rules.
---

# Codebase Design

Use deep modules as one architecture lens: place cohesive behavior behind a small, stable interface at a useful seam. Balance depth with the repository's existing architecture, domain vocabulary, performance constraints, and change patterns.

## Glossary

Use these terms consistently while applying this skill, but preserve established repository terminology in user-facing recommendations. Do not rename clear concepts merely to satisfy this glossary.

**Module** — anything with an interface and an implementation. Deliberately scale-agnostic: a function, class, package, component, service, or tier-spanning slice.

**Interface** — everything a caller must know to use a module correctly: the callable surface plus relevant invariants, ordering constraints, error modes, configuration, and performance characteristics. This is broader than a TypeScript `interface` or function signature.

**Implementation** — what's inside a module, its body of code. Distinct from **Adapter**: a thing can be a small adapter with a large implementation (a Postgres repo) or a large adapter with a small implementation (an in-memory fake). Reach for "adapter" when the seam is the topic; "implementation" otherwise.

**Depth** — leverage at the interface: the amount of behaviour a caller (or test) can exercise per unit of interface they have to learn. A module is **deep** when a large amount of behaviour sits behind a small interface, **shallow** when the interface is nearly as complex as the implementation.

**Seam** _(Michael Feathers)_ — a place where behavior can be changed or substituted without editing the caller. Where to put a seam is distinct from what goes behind it. Use the repository's term `boundary` when that is already clear and not confused with a DDD bounded context.

**Adapter** — a concrete thing that satisfies an interface at a seam. Describes *role* (what slot it fills), not substance (what's inside).

**Leverage** — what callers get from depth: more capability per unit of interface they learn. One implementation pays back across N call sites and M tests.

**Locality** — what maintainers get from depth: change, bugs, knowledge, and verification concentrate in one place rather than spreading across callers. Fix once, fixed everywhere.

## Deep vs shallow

**Deep module** = small interface + lots of implementation:

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + little implementation (a possible design smell, not an automatic defect):

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

When designing an interface, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

## Principles

- **Depth is judged from the caller's perspective.** A deep module can still contain small internal parts and internal test seams.
- **The deletion test is a heuristic.** If deleting a module merely redistributes complexity across callers, it may be earning its keep. Also consider cohesion, ownership, performance, and change frequency.
- **Stable interfaces are usually strong test surfaces.** Lower-level tests remain useful for algorithms, failure isolation, persistence contracts, and fast diagnostics.
- **Require a concrete reason for a seam.** Multiple production adapters are one justification, but testability, an external system boundary, ownership, or volatility can also justify one.

## Designing for testability

Good interfaces make testing natural:

1. **Inject dependencies at meaningful seams.** Avoid dependency injection for cheap, stable implementation details.

   ```typescript
   // Testable
   function processOrder(order, paymentGateway) {}

   // Hard to test
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. **Make effects observable and controllable.** Returning a value is often useful, but side effects can be legitimate domain behavior.

   ```typescript
   // Testable
   function calculateDiscount(cart): Discount {}

   // Hard to test
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. **Keep the surface no larger than the callers require.** Fewer methods and parameters often help, but do not combine unrelated behavior solely to minimize counts.

## Relationships

- A **Module** may expose one or more caller-oriented **Interfaces**; keep each coherent and stable.
- **Depth** is a property of a **Module**, measured against its **Interface**.
- A **Seam** is where a **Module**'s **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for maintainers.

## Cautions

- **Depth as ratio of implementation-lines to interface-lines** (Ousterhout): rewards padding the implementation. We use depth-as-leverage instead.
- **"Interface" as the TypeScript `interface` keyword or a class's public methods**: too narrow — interface here includes every fact a caller must know.
- **Terminology replacement for its own sake**: preserve clear project language and explain how it maps to this skill's concepts.

## Going deeper

- **Deepening a cluster given its dependencies** — see [DEEPENING.md](DEEPENING.md): dependency categories, seam discipline, and replace-don't-layer testing.
- **Exploring alternative interfaces** — see [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md): spin up parallel sub-agents to design the interface several radically different ways, then compare on depth, locality, and seam placement.
