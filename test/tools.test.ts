import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../packages/agent-core/src/index.js';

describe('Phase 2: Tool Registry', () => {
  it('registers and executes a tool with schema validation', async () => {
    const registry = new ToolRegistry();

    registry.register({
      name: 'geo.pointInPolygon',
      description: 'Determines whether a coordinate lies within a parcel polygon',
      schema: z.object({
        latitude: z.number(),
        longitude: z.number(),
        polygonCoords: z.array(z.tuple([z.number(), z.number()]))
      }),
      execute: async input => {
        return { isInside: true, distanceToCentroidM: 14.2 };
      }
    });

    expect(registry.has('geo.pointInPolygon')).toBe(true);

    const result = await registry.execute('geo.pointInPolygon', {
      latitude: 9.255,
      longitude: 77.385,
      polygonCoords: [[77.384, 9.254], [77.386, 9.254], [77.386, 9.256]]
    });

    expect(result.success).toBe(true);
    expect(result.data.isInside).toBe(true);
  });

  it('rejects invalid inputs schema', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'dummy.tool',
      description: 'Dummy',
      schema: z.object({ code: z.string() }),
      execute: async () => 'ok'
    });

    const result = await registry.execute('dummy.tool', { code: 123 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Tool input validation failed');
  });
});