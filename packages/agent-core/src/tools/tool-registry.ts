import { z } from 'zod';

export interface Tool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  execute(input: TInput, context?: any): Promise<TOutput>;
}

export interface ToolExecutionResult<T = any> {
  toolName: string;
  success: boolean;
  data?: T;
  error?: string;
  latencyMs: number;
}

export class ToolRegistry {
  private tools: Map<string, Tool<any, any>> = new Map();

  register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool with name '${tool.name}' is already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool<any, any> | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): { name: string; description: string }[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description
    }));
  }

  async execute<T = any>(
    name: string,
    rawInput: any,
    options: { timeoutMs?: number; context?: any } = {}
  ): Promise<ToolExecutionResult<T>> {
    const start = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        toolName: name,
        success: false,
        error: `Tool '${name}' not found in ToolRegistry`,
        latencyMs: Date.now() - start
      };
    }

    // 1. Validate inputs via schema
    const parseResult = tool.schema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        toolName: name,
        success: false,
        error: `Tool input validation failed: ${parseResult.error.message}`,
        latencyMs: Date.now() - start
      };
    }

    const timeoutMs = options.timeoutMs || 25000;

    // 2. Execute with timeout protection
    try {
      const executePromise = tool.execute(parseResult.data, options.context);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const result = (await Promise.race([executePromise, timeoutPromise])) as T;

      return {
        toolName: name,
        success: true,
        data: result,
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        toolName: name,
        success: false,
        error: err.message || 'Unknown tool execution error',
        latencyMs: Date.now() - start
      };
    }
  }
}