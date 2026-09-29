export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxAttempts?: number;
}

export interface CircuitBreakerTelemetry {
  name: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  failureThreshold: number;
  resetTimeoutMs: number;
  isSimulatedFailure: boolean;
}

export class CircuitBreaker {
  public readonly name: string;
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private isSimulated: boolean = false;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenMaxAttempts: number;

  constructor(name: string, config: CircuitBreakerConfig = {}) {
    this.name = name;
    this.failureThreshold = config.failureThreshold ?? 3;
    this.resetTimeoutMs = config.resetTimeoutMs ?? 30000;
    this.halfOpenMaxAttempts = config.halfOpenMaxAttempts ?? 2;
  }

  getState(): CircuitState {
    if (this.isSimulated) {
      return 'OPEN';
    }
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const currentState = this.getState();
    return currentState === 'CLOSED' || currentState === 'HALF_OPEN';
  }

  recordSuccess(): void {
    if (this.isSimulated) return;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxAttempts) {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    }
  }

  trip(): void {
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
  }

  simulateFailure(enabled: boolean = true): void {
    this.isSimulated = enabled;
    if (enabled) {
      this.state = 'OPEN';
      this.lastFailureTime = Date.now();
      this.failureCount = this.failureThreshold;
    } else {
      this.reset();
    }
  }

  reset(): void {
    this.isSimulated = false;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
  }

  getTelemetry(): CircuitBreakerTelemetry {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime > 0 ? this.lastFailureTime : null,
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
      isSimulatedFailure: this.isSimulated
    };
  }
}