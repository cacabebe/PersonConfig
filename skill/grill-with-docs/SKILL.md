---
name: grill-with-docs
description: Stress-test a plan or design one decision at a time while maintaining the project's domain glossary and recording only durable architectural decisions. Use only when explicitly invoked by the user.
---

# Grill with Docs

Apply both `$grilling` and `$domain-modeling`:

1. Inspect facts from the repository instead of asking the user to repeat discoverable information.
2. Ask one consequential decision at a time and include a recommended answer.
3. Challenge ambiguous domain terms and test decisions against concrete scenarios.
4. Update `CONTEXT.md` only when a domain term is actually resolved.
5. Offer an ADR only when the decision is hard to reverse, surprising without context, and the result of a real trade-off.
6. Do not implement the design until the user confirms that the shared understanding is complete.
