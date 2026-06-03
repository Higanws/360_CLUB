import type { ToolDefinition } from '../tools/types.js';

export type CapabilityEntry = {
  name: string;
  domain: string;
  minRole: string;
  workflowResource?: string;
  restHint?: string;
};

const CAPABILITY_META: CapabilityEntry[] = [
  { name: 'club360_session_status', domain: 'session', minRole: 'business', workflowResource: 'club360://guide/domain' },
  { name: 'club360_list_capabilities', domain: 'session', minRole: 'business' },
  { name: 'member_find', domain: 'members', minRole: 'business', workflowResource: 'club360://guide/workflows', restHint: 'GET /members/search o GET /members' },
  { name: 'member_get', domain: 'members', minRole: 'business', restHint: 'GET /members/:id' },
  { name: 'member_create', domain: 'members', minRole: 'administrator', workflowResource: 'club360://guide/workflows', restHint: 'POST /members' },
  { name: 'member_update', domain: 'members', minRole: 'business', restHint: 'PATCH /members/:id' },
  { name: 'member_delete', domain: 'members', minRole: 'administrator', restHint: 'DELETE /members/:id' },
  { name: 'nutrition_overview', domain: 'nutrition', minRole: 'business', restHint: 'GET /nutrition/overview' },
  { name: 'nutrition_plan_get', domain: 'nutrition', minRole: 'business', restHint: 'GET /nutrition/members/:id/plan' },
  { name: 'nutrition_meal_update', domain: 'nutrition', minRole: 'business', workflowResource: 'club360://guide/nutrition-model', restHint: 'GET+PUT plan' },
  { name: 'nutrition_meal_add', domain: 'nutrition', minRole: 'business', workflowResource: 'club360://guide/nutrition-model' },
  { name: 'nutrition_meal_remove', domain: 'nutrition', minRole: 'business' },
  { name: 'staff_find', domain: 'staff', minRole: 'business', restHint: 'GET /staff' },
  { name: 'staff_get', domain: 'staff', minRole: 'business', restHint: 'GET /staff/:id' },
  { name: 'staff_create', domain: 'staff', minRole: 'administrator', restHint: 'POST /staff' },
  { name: 'staff_update', domain: 'staff', minRole: 'administrator', restHint: 'PATCH /staff/:id' },
  { name: 'staff_delete', domain: 'staff', minRole: 'administrator', restHint: 'DELETE /staff/:id' },
  { name: 'membership_list', domain: 'memberships', minRole: 'administrator', restHint: 'GET /memberships' },
  { name: 'membership_get', domain: 'memberships', minRole: 'administrator', restHint: 'GET /memberships/:id' },
  { name: 'membership_create', domain: 'memberships', minRole: 'administrator', restHint: 'POST /memberships' },
  { name: 'membership_update', domain: 'memberships', minRole: 'administrator', restHint: 'PATCH /memberships/:id' },
  { name: 'payment_expiring_list', domain: 'payments', minRole: 'administrator', restHint: 'GET /payments/membership/expiring-this-month' },
  { name: 'payment_manual_register', domain: 'payments', minRole: 'administrator', workflowResource: 'club360://guide/workflows', restHint: 'POST /payments/membership/manual' },
  { name: 'payment_mark_paid', domain: 'payments', minRole: 'administrator', restHint: 'PATCH /payments/membership/:id/paid' },
  { name: 'dashboard_business_metrics', domain: 'dashboard', minRole: 'administrator', restHint: 'GET /dashboard/business-metrics' },
  { name: 'settings_branding_get', domain: 'settings', minRole: 'business', restHint: 'GET /settings/branding' },
  { name: 'activity_list', domain: 'activities', minRole: 'business', restHint: 'GET /activities' },
  { name: 'activity_get', domain: 'activities', minRole: 'business', restHint: 'GET /activities/:id' },
  { name: 'activity_create', domain: 'activities', minRole: 'business', restHint: 'POST /activities' },
  { name: 'activity_update', domain: 'activities', minRole: 'business', restHint: 'PATCH /activities/:id' },
  { name: 'activity_category_list', domain: 'activities', minRole: 'business', restHint: 'GET /activities/categories' },
  { name: 'activity_category_create', domain: 'activities', minRole: 'business', restHint: 'POST /activities/categories' },
  { name: 'routine_list', domain: 'training', minRole: 'business', restHint: 'GET /training-routines' },
  { name: 'routine_get', domain: 'training', minRole: 'business', restHint: 'GET /training-routines/:id' },
  { name: 'routine_create', domain: 'training', minRole: 'business', restHint: 'POST /training-routines' },
  { name: 'routine_update', domain: 'training', minRole: 'business', restHint: 'PATCH /training-routines/:id' },
  { name: 'routine_delete', domain: 'training', minRole: 'business', restHint: 'DELETE /training-routines/:id' },
  { name: 'assignment_list', domain: 'training', minRole: 'business', restHint: 'GET /training-assignments' },
  { name: 'assignment_get', domain: 'training', minRole: 'business', restHint: 'GET /training-assignments/:id' },
  { name: 'assignment_create', domain: 'training', minRole: 'business', workflowResource: 'club360://guide/workflows', restHint: 'POST /training-assignments' },
  { name: 'assignment_delete', domain: 'training', minRole: 'business', restHint: 'DELETE /training-assignments/:id' },
  { name: 'access_check', domain: 'access', minRole: 'administrator', restHint: 'POST /access-control/check' },
  { name: 'access_recent_logs', domain: 'access', minRole: 'administrator', restHint: 'GET /access-control/recent' },
  { name: 'pos_catalog', domain: 'pos', minRole: 'administrator', restHint: 'GET /pos/catalog' },
  { name: 'pos_product_list', domain: 'pos', minRole: 'administrator', restHint: 'GET /pos/products' },
  { name: 'pos_product_create', domain: 'pos', minRole: 'administrator', restHint: 'POST /pos/products' },
  { name: 'pos_product_update', domain: 'pos', minRole: 'administrator', restHint: 'PATCH /pos/products/:id' },
  { name: 'pos_product_stock_update', domain: 'pos', minRole: 'administrator', restHint: 'PATCH /pos/products/:id/stock' },
  { name: 'pos_product_delete', domain: 'pos', minRole: 'administrator', restHint: 'DELETE /pos/products/:id' },
  { name: 'pos_sale_create', domain: 'pos', minRole: 'administrator', restHint: 'POST /pos/sales' },
  { name: 'pos_sales_list', domain: 'pos', minRole: 'administrator', restHint: 'GET /pos/sales' },
];

export function listCapabilitiesForTools(
  tools: ToolDefinition[],
  roleName: string,
): { role: string; tools: CapabilityEntry[] } {
  const names = new Set(tools.map((t) => t.name));
  return {
    role: roleName,
    tools: CAPABILITY_META.filter((c) => names.has(c.name)),
  };
}

export { CAPABILITY_META };
