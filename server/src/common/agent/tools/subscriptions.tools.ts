import { SubscriptionsService } from 'src/resources/subscriptions/subscriptions.service';
import { SubscriptionPlansService } from 'src/resources/subscriptions/subscription-plans.service';
import {
  AgentContext,
  ToolCategory,
  ToolDefinition,
  ToolResult,
} from '../interfaces/tool.interface';

function ok(data: any): ToolResult {
  return { success: true, data };
}

function fail(error: unknown): ToolResult {
  return { success: false, error: (error as Error).message };
}

/** Wraps async work in try/catch and satisfies ToolDefinition.handler signature. */
function wrapTool(
  run: (params: any) => Promise<any>,
): (params: any, context: AgentContext) => Promise<ToolResult> {
  return async (params, context) => {
    void context;
    try {
      const result = await run(params);
      return ok(result);
    } catch (e) {
      return fail(e);
    }
  };
}

export function createSubscriptionsTools(
  subscriptionsService: SubscriptionsService,
  plansService: SubscriptionPlansService,
): ToolDefinition[] {
  return [
    {
      name: 'subscriptions_list_plans',
      description:
        'List subscription plans with optional filters (search, active/public flags, pagination).',
      category: ToolCategory.SUBSCRIPTIONS,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by name or description',
          },
          isActive: { type: 'boolean', description: 'Filter by active plans' },
          isPublic: { type: 'boolean', description: 'Filter by public plans' },
          page: { type: 'integer', description: 'Page number (1-based)' },
          limit: { type: 'integer', description: 'Page size' },
        },
      },
      handler: wrapTool((params) => plansService.findAll(params)),
    },
    {
      name: 'subscriptions_get_plan',
      description: 'Get a subscription plan by ID.',
      category: ToolCategory.SUBSCRIPTIONS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Subscription plan UUID' },
        },
        required: ['id'],
      },
      handler: wrapTool((params) =>
        plansService.findSubscriptionPlanById(params.id),
      ),
    },
    {
      name: 'subscriptions_create_plan',
      description: 'Create a subscription plan.',
      category: ToolCategory.SUBSCRIPTIONS,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name' },
          description: { type: 'string', description: 'Plan description' },
          pricePerUserMonthly: {
            type: 'number',
            description: 'Monthly price per user',
          },
          pricePerUserAnnual: {
            type: 'number',
            description: 'Annual price per user (stored as pricePerUserYearly)',
          },
          maxContacts: {
            type: 'integer',
            description: 'Maximum contacts allowed',
          },
          features: {
            type: 'object',
            description: 'Feature flags / metadata object',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the plan is active',
          },
          isPublic: {
            type: 'boolean',
            description: 'Whether the plan is publicly visible',
          },
        },
        required: ['name'],
      },
      handler: wrapTool(async (params) => {
        const {
          name,
          description,
          pricePerUserMonthly,
          pricePerUserAnnual,
          pricePerUserYearly,
          maxContacts,
          features,
          isActive,
          isPublic,
        } = params;
        return plansService.createSubscriptionPlan({
          name,
          description,
          pricePerUserMonthly,
          pricePerUserYearly: pricePerUserYearly ?? pricePerUserAnnual,
          maxContacts,
          features,
          isActive,
          isPublic,
        });
      }),
    },
    {
      name: 'subscriptions_update_plan',
      description:
        'Update a subscription plan by ID. Pass any updatable plan fields in params.',
      category: ToolCategory.SUBSCRIPTIONS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Subscription plan UUID' },
          name: { type: 'string', description: 'Plan name' },
          description: { type: 'string', description: 'Plan description' },
          pricePerUserMonthly: {
            type: 'number',
            description: 'Monthly price per user',
          },
          pricePerUserAnnual: {
            type: 'number',
            description: 'Annual price per user (maps to pricePerUserYearly)',
          },
          maxContacts: {
            type: 'integer',
            description: 'Maximum contacts allowed',
          },
          features: {
            type: 'object',
            description: 'Feature flags / metadata object',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the plan is active',
          },
          isPublic: {
            type: 'boolean',
            description: 'Whether the plan is publicly visible',
          },
        },
        required: ['id'],
      },
      handler: wrapTool(async (params) => {
        const { id, pricePerUserAnnual, pricePerUserYearly, ...rest } = params;
        const payload: Record<string, any> = { ...rest };
        if (
          pricePerUserYearly !== undefined ||
          pricePerUserAnnual !== undefined
        ) {
          payload.pricePerUserYearly = pricePerUserYearly ?? pricePerUserAnnual;
        }
        return plansService.updateSubscriptionPlan(id, payload);
      }),
    },
    {
      name: 'subscriptions_delete_plan',
      description: 'Soft-delete a subscription plan by ID.',
      category: ToolCategory.SUBSCRIPTIONS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Subscription plan UUID' },
        },
        required: ['id'],
      },
      handler: wrapTool((params) =>
        plansService.removeSubscriptionPlan(params.id),
      ),
    },
    {
      name: 'subscriptions_list',
      description:
        'List subscriptions with optional organization, plan, status filters and pagination.',
      category: ToolCategory.SUBSCRIPTIONS,
      inputSchema: {
        type: 'object',
        properties: {
          organizationId: { type: 'string', description: 'Organization UUID' },
          planId: { type: 'string', description: 'Subscription plan UUID' },
          status: {
            type: 'string',
            description: 'Subscription status',
            enum: [
              'ACTIVE',
              'CANCELLED',
              'PAST_DUE',
              'UNPAID',
              'INCOMPLETE',
              'TRIAL',
            ],
          },
          page: { type: 'integer', description: 'Page number (1-based)' },
          limit: { type: 'integer', description: 'Page size' },
        },
      },
      handler: wrapTool((params) => subscriptionsService.findAll(params)),
    },
    {
      name: 'subscriptions_get',
      description: 'Get a subscription by ID (includes plan relation).',
      category: ToolCategory.SUBSCRIPTIONS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Subscription UUID' },
        },
        required: ['id'],
      },
      handler: wrapTool((params) =>
        subscriptionsService.findSubscriptionById(params.id),
      ),
    },
    {
      name: 'subscriptions_get_active',
      description:
        'Get the active or trial subscription for an organization, if any.',
      category: ToolCategory.SUBSCRIPTIONS,
      inputSchema: {
        type: 'object',
        properties: {
          organizationId: { type: 'string', description: 'Organization UUID' },
        },
        required: ['organizationId'],
      },
      handler: wrapTool((params) =>
        subscriptionsService.findActiveSubscriptionByOrganizationId(
          params.organizationId,
        ),
      ),
    },
    {
      name: 'subscriptions_cancel',
      description:
        'Cancel the active subscription for the organization linked to the given subscription ID. Optional cancellation reason.',
      category: ToolCategory.SUBSCRIPTIONS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Subscription UUID' },
          reason: {
            type: 'string',
            description: 'Optional cancellation reason',
          },
        },
        required: ['id'],
      },
      handler: wrapTool(async (params) => {
        const subscription = await subscriptionsService.findSubscriptionById(
          params.id,
        );
        return subscriptionsService.cancelSubscription(
          subscription.organizationId,
          params.reason,
        );
      }),
    },
    {
      name: 'subscriptions_delete',
      description: 'Soft-delete a subscription by ID.',
      category: ToolCategory.SUBSCRIPTIONS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Subscription UUID' },
        },
        required: ['id'],
      },
      handler: wrapTool((params) =>
        subscriptionsService.removeSubscription(params.id),
      ),
    },
  ];
}
