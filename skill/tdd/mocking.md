# When to Mock

Prefer mocks, fakes, or test implementations at meaningful seams such as:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Avoid mocking:

- Private methods and incidental internal collaborators
- Long call chains that mirror the current implementation
- Values or behavior that can be exercised cheaply with a real implementation

An owned module can still have a useful test double when it represents a real seam, is expensive or nondeterministic to run, or the interaction itself is part of the contract. Prefer a small fake over a brittle expectation-heavy mock when practical.

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer behavior-specific interfaces when they improve clarity**

Create specific functions for each external operation instead of one generic function with conditional logic:

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// LESS SPECIFIC: Mocking may require conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The behavior-specific approach can provide:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier visibility into which operations a test exercises
- Type safety per endpoint

Keep a generic transport abstraction when the repository genuinely benefits from it; do not introduce one interface per endpoint solely to satisfy a test.
