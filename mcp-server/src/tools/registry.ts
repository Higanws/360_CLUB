import type { Club360Client } from '../client/club360-client.js';
import { roleMeetsMin } from '../auth/session.js';
import { formatToolError } from '../client/errors.js';
import { sessionTools } from './session.js';
import { memberTools } from './members.js';
import { nutritionTools } from './nutrition.js';
import { staffTools } from './staff.js';
import { membershipTools } from './memberships.js';
import {
  paymentTools,
  dashboardTools,
  settingsTools,
} from './payments-dashboard-settings.js';
import { activityTools, trainingTools } from './activities-training.js';
import { accessTools, posTools } from './access-pos.js';
import type { ToolDefinition } from './types.js';
import { listCapabilitiesForTools } from '../catalog/capabilities.js';
import { formatToolSuccess } from '../client/errors.js';

const ALL_TOOLS: ToolDefinition[] = [
  ...sessionTools,
  ...memberTools,
  ...nutritionTools,
  ...staffTools,
  ...membershipTools,
  ...paymentTools,
  ...dashboardTools,
  ...settingsTools,
  ...activityTools,
  ...trainingTools,
  ...accessTools,
  ...posTools,
];

/** Parche list_capabilities para recibir catálogo filtrado */
const listCap = ALL_TOOLS.find((t) => t.name === 'club360_list_capabilities');
if (listCap) {
  listCap.handler = async (client) => {
    const user = await client.getMe();
    const visible = await filterToolsForRole(client, ALL_TOOLS);
    const caps = listCapabilitiesForTools(visible, user.role_name);
    return formatToolSuccess({
      ...caps,
      resources: [
        'club360://guide/domain',
        'club360://guide/workflows',
        'club360://guide/nutrition-model',
        'club360://guide/permissions',
      ],
    });
  };
}

export async function filterToolsForRole(
  client: Club360Client,
  tools: ToolDefinition[] = ALL_TOOLS,
): Promise<ToolDefinition[]> {
  const user = await client.ensureAuthenticated();
  return tools.filter((t) => roleMeetsMin(user.role_name, t.minRole));
}

export function getAllToolDefinitions(): ToolDefinition[] {
  return ALL_TOOLS;
}

export async function invokeTool(
  client: Club360Client,
  name: string,
  args: unknown,
): Promise<string> {
  const tool = ALL_TOOLS.find((t) => t.name === name);
  if (!tool) {
    return formatToolError(new Error(`Tool desconocida: ${name}`));
  }
  const user = await client.ensureAuthenticated();
  if (!roleMeetsMin(user.role_name, tool.minRole)) {
    return formatToolError(
      new Error(
        `Tool "${name}" requiere rol ${tool.minRole}. Tu rol: ${user.role_name}. Ver club360://guide/permissions`,
      ),
    );
  }
  try {
    const parsed = tool.inputSchema.parse(args ?? {});
    return await tool.handler(client, parsed);
  } catch (err) {
    return formatToolError(err);
  }
}

export async function listToolsForSession(
  client: Club360Client,
): Promise<ToolDefinition[]> {
  return filterToolsForRole(client, ALL_TOOLS);
}
