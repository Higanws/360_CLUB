import type { z } from 'zod';
import type { Club360Client } from '../client/club360-client.js';
import type { RoleLevel } from '../auth/session.js';

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  minRole: RoleLevel;
  handler: (client: Club360Client, args: unknown) => Promise<string>;
};
