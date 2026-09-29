export type TraceEventType =
  | 'step_start'
  | 'model_selected'
  | 'tool_call'
  | 'tool_result'
  | 'fallback_triggered'
  | 'verification_check'
  | 'step_complete'
  | 'error';

export interface TraceEvent {
  runId: string;
  timestamp: string;
  type: TraceEventType;
  stepId?: string;
  agent?: string;
  data: Record<string, any>;
}

export type TraceListener = (event: TraceEvent) => void;

export class TraceRecorder {
  private readonly runId: string;
  private events: TraceEvent[] = [];
  private listeners: Set<TraceListener> = new Set();

  constructor(runId: string) {
    this.runId = runId;
  }

  subscribe(listener: TraceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(type: TraceEventType, data: Record<string, any>, stepId?: string, agent?: string): TraceEvent {
    const event: TraceEvent = {
      runId: this.runId,
      timestamp: new Date().toISOString(),
      type,
      stepId,
      agent,
      data
    };

    this.events.push(event);

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in trace listener:', err);
      }
    }

    return event;
  }

  getEvents(): TraceEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}