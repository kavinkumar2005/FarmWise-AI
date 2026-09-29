import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from '../packages/agent-core/src/index.js';

describe('Phase 2: Circuit Breaker', () => {
  it('starts in CLOSED state and allows execution', () => {
    const cb = new CircuitBreaker('test-model', { failureThreshold: 3 });
    expect(cb.getState()).toBe('CLOSED');
    expect(cb.canExecute()).toBe(true);
  });

  it('trips to OPEN after reaching failure threshold', () => {
    const cb = new CircuitBreaker('test-model', { failureThreshold: 3 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe('CLOSED');
    cb.recordFailure(); // 3rd failure
    expect(cb.getState()).toBe('OPEN');
    expect(cb.canExecute()).toBe(false);
  });

  it('resets cleanly upon manual reset', () => {
    const cb = new CircuitBreaker('test-model');
    cb.trip();
    expect(cb.getState()).toBe('OPEN');
    cb.reset();
    expect(cb.getState()).toBe('CLOSED');
    expect(cb.canExecute()).toBe(true);
  });
});