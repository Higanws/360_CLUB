/**
 * Smoke test del MCP contra API local (sin servidor MCP stdio).
 * Uso: npm run smoke
 */
import { loadConfig } from './config.js';
import { Club360Client } from './client/club360-client.js';
import { invokeTool } from './tools/registry.js';

async function run() {
  const config = loadConfig();
  const client = new Club360Client(config);
  await client.ensureAuthenticated();

  const tests: { tool: string; args: Record<string, unknown> }[] = [
    { tool: 'club360_session_status', args: {} },
    { tool: 'club360_list_capabilities', args: {} },
    { tool: 'member_find', args: { query: 'Ana', limit: 5 } },
    { tool: 'member_get', args: { member_id: 3 } },
    { tool: 'settings_branding_get', args: {} },
    { tool: 'nutrition_overview', args: {} },
    { tool: 'nutrition_plan_get', args: { member_id: 3 } },
  ];

  // Orquestación: add o update comida según plan existente
  const planOut = await invokeTool(client, 'nutrition_plan_get', { member_id: 3 });
  const hasSlots = planOut.includes('"schedule_slots"') && !planOut.includes('"schedule_slots": []');
  if (hasSlots) {
    tests.push({
      tool: 'nutrition_meal_update',
      args: {
        member_id: 3,
        weekday_name: 'lunes',
        meal_event: 'Almuerzo',
        dish: 'Plato actualizado por MCP smoke test',
      },
    });
  } else {
    tests.push({
      tool: 'nutrition_meal_add',
      args: {
        member_id: 3,
        weekday_name: 'lunes',
        hour: 13,
        meal_event: 'Almuerzo',
        dish: 'Ensalada smoke test MCP',
      },
    });
  }

  let passed = 0;
  const ran = new Set<string>();
  for (const t of tests) {
    if (ran.has(t.tool)) continue;
    ran.add(t.tool);
    const out = await invokeTool(client, t.tool, t.args);
    const ok = out.includes('"ok": true');
    console.log(ok ? '✓' : '✗', t.tool);
    if (!ok) {
      console.log(out.slice(0, 400));
      process.exitCode = 1;
    } else {
      passed += 1;
    }
  }

  console.log(`\n${passed}/${tests.length} tools OK`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
