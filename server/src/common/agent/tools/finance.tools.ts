import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
  AgentContext,
  ToolInputSchema,
} from '../interfaces/tool.interface';
import { FinanceService } from 'src/resources/finance/finance.service';

export function createFinanceTools(
  financeService: FinanceService,
): ToolDefinition[] {
  return [
    // ── Invoices ──────────────────────────────────────────────
    {
      name: 'finance_list_invoices',
      description:
        'List and search invoices with optional filters for status, company, contact, date range, and currency.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by invoice number or customer name',
          },
          status: {
            type: 'string',
            description: 'Filter by invoice status',
            enum: [
              'DRAFT',
              'SENT',
              'VIEWED',
              'PARTIALLY_PAID',
              'PAID',
              'OVERDUE',
              'CANCELLED',
            ],
          },
          crmCompanyId: {
            type: 'string',
            description: 'Filter by CRM company ID',
          },
          crmContactId: {
            type: 'string',
            description: 'Filter by CRM contact ID',
          },
          dateRange: {
            type: 'string',
            description: 'Filter by date range (e.g. this_month, this_quarter)',
          },
          currency: {
            type: 'string',
            description: 'Filter by currency code',
          },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findAllInvoices(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_create_invoice',
      description: 'Create a new invoice with optional line items.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          crmCompanyId: {
            type: 'string',
            description: 'Associated CRM company ID',
          },
          crmContactId: {
            type: 'string',
            description: 'Associated CRM contact ID',
          },
          crmDealId: {
            type: 'string',
            description: 'Associated CRM deal ID',
          },
          status: {
            type: 'string',
            description: 'Invoice status',
            enum: [
              'DRAFT',
              'SENT',
              'VIEWED',
              'PARTIALLY_PAID',
              'PAID',
              'OVERDUE',
              'CANCELLED',
            ],
          },
          issueDate: {
            type: 'string',
            description: 'Issue date (ISO 8601)',
          },
          dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
          discountAmount: {
            type: 'number',
            description: 'Discount amount',
            minimum: 0,
          },
          discountType: {
            type: 'string',
            description: 'Discount type',
            enum: ['PERCENTAGE', 'FIXED'],
          },
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD)',
          },
          notes: { type: 'string', description: 'Invoice notes' },
          terms: { type: 'string', description: 'Payment terms' },
          customerName: { type: 'string', description: 'Customer name' },
          customerEmail: { type: 'string', description: 'Customer email' },
          items: {
            type: 'array',
            description: 'Invoice line items',
            items: {
              type: 'object',
              properties: {
                productId: {
                  type: 'string',
                  description: 'Product ID',
                },
                description: {
                  type: 'string',
                  description: 'Line item description',
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity',
                  minimum: 0.01,
                },
                unitPrice: {
                  type: 'number',
                  description: 'Unit price',
                  minimum: 0,
                },
                taxRateId: {
                  type: 'string',
                  description: 'Tax rate ID',
                },
                discountPercent: {
                  type: 'number',
                  description: 'Line discount percentage',
                  minimum: 0,
                },
              },
              required: ['description', 'quantity', 'unitPrice'],
            },
          },
        },
        required: ['issueDate', 'dueDate'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.createInvoice(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_get_invoice',
      description: 'Get an invoice by its ID, including line items and payments.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Invoice ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findInvoiceById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_update_invoice',
      description: 'Update an existing invoice.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Invoice ID' },
          crmCompanyId: {
            type: 'string',
            description: 'Associated CRM company ID',
          },
          crmContactId: {
            type: 'string',
            description: 'Associated CRM contact ID',
          },
          crmDealId: {
            type: 'string',
            description: 'Associated CRM deal ID',
          },
          status: {
            type: 'string',
            description: 'Invoice status',
            enum: [
              'DRAFT',
              'SENT',
              'VIEWED',
              'PARTIALLY_PAID',
              'PAID',
              'OVERDUE',
              'CANCELLED',
            ],
          },
          issueDate: {
            type: 'string',
            description: 'Issue date (ISO 8601)',
          },
          dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
          discountAmount: {
            type: 'number',
            description: 'Discount amount',
            minimum: 0,
          },
          discountType: {
            type: 'string',
            description: 'Discount type',
            enum: ['PERCENTAGE', 'FIXED'],
          },
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD)',
          },
          notes: { type: 'string', description: 'Invoice notes' },
          terms: { type: 'string', description: 'Payment terms' },
          customerName: { type: 'string', description: 'Customer name' },
          customerEmail: { type: 'string', description: 'Customer email' },
          items: {
            type: 'array',
            description: 'Invoice line items',
            items: {
              type: 'object',
              properties: {
                productId: {
                  type: 'string',
                  description: 'Product ID',
                },
                description: {
                  type: 'string',
                  description: 'Line item description',
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity',
                  minimum: 0.01,
                },
                unitPrice: {
                  type: 'number',
                  description: 'Unit price',
                  minimum: 0,
                },
                taxRateId: {
                  type: 'string',
                  description: 'Tax rate ID',
                },
                discountPercent: {
                  type: 'number',
                  description: 'Line discount percentage',
                  minimum: 0,
                },
              },
              required: ['description', 'quantity', 'unitPrice'],
            },
          },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.updateInvoice(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_delete_invoice',
      description: 'Delete an invoice by its ID.',
      category: ToolCategory.FINANCE,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Invoice ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.deleteInvoice(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_mark_invoice_sent',
      description: 'Mark an invoice as sent, changing its status from DRAFT to SENT.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Invoice ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.markInvoiceSent(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_cancel_invoice',
      description: 'Cancel an invoice.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Invoice ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.cancelInvoice(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_list_invoice_payments',
      description: 'List all payments recorded against a specific invoice.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'Invoice ID' },
        },
        required: ['invoiceId'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findInvoicePayments(
            params.invoiceId,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_create_invoice_payment',
      description: 'Record a payment against an invoice.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'Invoice ID' },
          amount: {
            type: 'number',
            description: 'Payment amount',
            minimum: 0.01,
          },
          paymentDate: {
            type: 'string',
            description: 'Payment date (ISO 8601)',
          },
          paymentMethod: {
            type: 'string',
            description: 'Payment method',
            enum: ['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHECK', 'OTHER'],
          },
          referenceNumber: {
            type: 'string',
            description: 'Payment reference number',
          },
          notes: { type: 'string', description: 'Payment notes' },
        },
        required: ['invoiceId', 'amount', 'paymentDate'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.recordPayment(
            params.invoiceId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Estimates ─────────────────────────────────────────────
    {
      name: 'finance_list_estimates',
      description:
        'List and search estimates with optional filters for status, company, contact, and date range.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by estimate number or customer name',
          },
          status: {
            type: 'string',
            description: 'Filter by estimate status',
            enum: [
              'DRAFT',
              'SENT',
              'VIEWED',
              'ACCEPTED',
              'REJECTED',
              'EXPIRED',
              'CONVERTED',
            ],
          },
          crmCompanyId: {
            type: 'string',
            description: 'Filter by CRM company ID',
          },
          crmContactId: {
            type: 'string',
            description: 'Filter by CRM contact ID',
          },
          dateRange: {
            type: 'string',
            description: 'Filter by date range',
          },
          currency: {
            type: 'string',
            description: 'Filter by currency code',
          },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findAllEstimates(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_create_estimate',
      description: 'Create a new estimate with optional line items.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          crmCompanyId: {
            type: 'string',
            description: 'Associated CRM company ID',
          },
          crmContactId: {
            type: 'string',
            description: 'Associated CRM contact ID',
          },
          crmDealId: {
            type: 'string',
            description: 'Associated CRM deal ID',
          },
          status: {
            type: 'string',
            description: 'Estimate status',
            enum: [
              'DRAFT',
              'SENT',
              'VIEWED',
              'ACCEPTED',
              'REJECTED',
              'EXPIRED',
              'CONVERTED',
            ],
          },
          issueDate: {
            type: 'string',
            description: 'Issue date (ISO 8601)',
          },
          validUntil: {
            type: 'string',
            description: 'Valid until date (ISO 8601)',
          },
          discountAmount: {
            type: 'number',
            description: 'Discount amount',
            minimum: 0,
          },
          discountType: {
            type: 'string',
            description: 'Discount type',
            enum: ['PERCENTAGE', 'FIXED'],
          },
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD)',
          },
          notes: { type: 'string', description: 'Estimate notes' },
          terms: { type: 'string', description: 'Terms and conditions' },
          customerName: { type: 'string', description: 'Customer name' },
          customerEmail: { type: 'string', description: 'Customer email' },
          items: {
            type: 'array',
            description: 'Estimate line items',
            items: {
              type: 'object',
              properties: {
                productId: {
                  type: 'string',
                  description: 'Product ID',
                },
                description: {
                  type: 'string',
                  description: 'Line item description',
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity',
                  minimum: 0.01,
                },
                unitPrice: {
                  type: 'number',
                  description: 'Unit price',
                  minimum: 0,
                },
                taxRateId: {
                  type: 'string',
                  description: 'Tax rate ID',
                },
                discountPercent: {
                  type: 'number',
                  description: 'Line discount percentage',
                  minimum: 0,
                },
              },
              required: ['description', 'quantity', 'unitPrice'],
            },
          },
        },
        required: ['issueDate'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.createEstimate(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_get_estimate',
      description: 'Get an estimate by its ID, including line items.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Estimate ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findEstimateById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_update_estimate',
      description: 'Update an existing estimate.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Estimate ID' },
          crmCompanyId: {
            type: 'string',
            description: 'Associated CRM company ID',
          },
          crmContactId: {
            type: 'string',
            description: 'Associated CRM contact ID',
          },
          crmDealId: {
            type: 'string',
            description: 'Associated CRM deal ID',
          },
          status: {
            type: 'string',
            description: 'Estimate status',
            enum: [
              'DRAFT',
              'SENT',
              'VIEWED',
              'ACCEPTED',
              'REJECTED',
              'EXPIRED',
              'CONVERTED',
            ],
          },
          issueDate: {
            type: 'string',
            description: 'Issue date (ISO 8601)',
          },
          validUntil: {
            type: 'string',
            description: 'Valid until date (ISO 8601)',
          },
          discountAmount: {
            type: 'number',
            description: 'Discount amount',
            minimum: 0,
          },
          discountType: {
            type: 'string',
            description: 'Discount type',
            enum: ['PERCENTAGE', 'FIXED'],
          },
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD)',
          },
          notes: { type: 'string', description: 'Estimate notes' },
          terms: { type: 'string', description: 'Terms and conditions' },
          customerName: { type: 'string', description: 'Customer name' },
          customerEmail: { type: 'string', description: 'Customer email' },
          items: {
            type: 'array',
            description: 'Estimate line items',
            items: {
              type: 'object',
              properties: {
                productId: {
                  type: 'string',
                  description: 'Product ID',
                },
                description: {
                  type: 'string',
                  description: 'Line item description',
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity',
                  minimum: 0.01,
                },
                unitPrice: {
                  type: 'number',
                  description: 'Unit price',
                  minimum: 0,
                },
                taxRateId: {
                  type: 'string',
                  description: 'Tax rate ID',
                },
                discountPercent: {
                  type: 'number',
                  description: 'Line discount percentage',
                  minimum: 0,
                },
              },
              required: ['description', 'quantity', 'unitPrice'],
            },
          },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.updateEstimate(
            params.id,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_delete_estimate',
      description: 'Delete an estimate by its ID.',
      category: ToolCategory.FINANCE,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Estimate ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.deleteEstimate(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_convert_estimate',
      description:
        'Convert an accepted estimate into an invoice, copying all line items.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Estimate ID to convert' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.convertEstimateToInvoice(
            params.id,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Products ──────────────────────────────────────────────
    {
      name: 'finance_list_products',
      description:
        'List and search products/services with optional filters for type and active status.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by product name or SKU',
          },
          type: {
            type: 'string',
            description: 'Filter by product type',
            enum: ['PRODUCT', 'SERVICE'],
          },
          isActive: {
            type: 'boolean',
            description: 'Filter by active status',
          },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findAllProducts(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_create_product',
      description: 'Create a new product or service for use in invoices and estimates.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Product name' },
          description: {
            type: 'string',
            description: 'Product description',
          },
          type: {
            type: 'string',
            description: 'Product type',
            enum: ['PRODUCT', 'SERVICE'],
          },
          unitPrice: {
            type: 'number',
            description: 'Unit price',
            minimum: 0,
          },
          unit: {
            type: 'string',
            description: 'Unit of measure (e.g. pcs, hrs)',
          },
          sku: { type: 'string', description: 'Stock keeping unit code' },
          taxRateId: {
            type: 'string',
            description: 'Default tax rate ID',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the product is active',
          },
        },
        required: ['name', 'unitPrice'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.createProduct(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_get_product',
      description: 'Get a product by its ID.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Product ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findProductById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_update_product',
      description: 'Update an existing product or service.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Product ID' },
          name: { type: 'string', description: 'Product name' },
          description: {
            type: 'string',
            description: 'Product description',
          },
          type: {
            type: 'string',
            description: 'Product type',
            enum: ['PRODUCT', 'SERVICE'],
          },
          unitPrice: {
            type: 'number',
            description: 'Unit price',
            minimum: 0,
          },
          unit: {
            type: 'string',
            description: 'Unit of measure (e.g. pcs, hrs)',
          },
          sku: { type: 'string', description: 'Stock keeping unit code' },
          taxRateId: {
            type: 'string',
            description: 'Default tax rate ID',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the product is active',
          },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.updateProduct(
            params.id,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_delete_product',
      description: 'Delete a product by its ID.',
      category: ToolCategory.FINANCE,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Product ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.deleteProduct(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Vendors ───────────────────────────────────────────────
    {
      name: 'finance_list_vendors',
      description:
        'List and search vendors with optional filters for active status and CRM company.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by vendor name or email',
          },
          isActive: {
            type: 'boolean',
            description: 'Filter by active status',
          },
          crmCompanyId: {
            type: 'string',
            description: 'Filter by linked CRM company ID',
          },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findAllVendors(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_create_vendor',
      description: 'Create a new vendor.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Vendor name' },
          email: { type: 'string', description: 'Vendor email' },
          phone: { type: 'string', description: 'Phone number' },
          address: { type: 'string', description: 'Street address' },
          city: { type: 'string', description: 'City' },
          state: { type: 'string', description: 'State or province' },
          country: { type: 'string', description: 'Country' },
          postalCode: { type: 'string', description: 'Postal/ZIP code' },
          website: { type: 'string', description: 'Vendor website URL' },
          notes: { type: 'string', description: 'Additional notes' },
          crmCompanyId: {
            type: 'string',
            description: 'Linked CRM company ID',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the vendor is active',
          },
        },
        required: ['name'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.createVendor(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_get_vendor',
      description: 'Get a vendor by its ID.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Vendor ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findVendorById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_update_vendor',
      description: 'Update an existing vendor.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Vendor ID' },
          name: { type: 'string', description: 'Vendor name' },
          email: { type: 'string', description: 'Vendor email' },
          phone: { type: 'string', description: 'Phone number' },
          address: { type: 'string', description: 'Street address' },
          city: { type: 'string', description: 'City' },
          state: { type: 'string', description: 'State or province' },
          country: { type: 'string', description: 'Country' },
          postalCode: { type: 'string', description: 'Postal/ZIP code' },
          website: { type: 'string', description: 'Vendor website URL' },
          notes: { type: 'string', description: 'Additional notes' },
          crmCompanyId: {
            type: 'string',
            description: 'Linked CRM company ID',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the vendor is active',
          },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.updateVendor(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_delete_vendor',
      description: 'Delete a vendor by its ID.',
      category: ToolCategory.FINANCE,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Vendor ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.deleteVendor(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Tax Rates ─────────────────────────────────────────────
    {
      name: 'finance_list_tax_rates',
      description: 'List tax rates with optional filters for type and active status.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by tax rate name',
          },
          type: {
            type: 'string',
            description: 'Filter by tax type',
            enum: ['GST', 'VAT', 'SALES_TAX', 'CUSTOM'],
          },
          isActive: {
            type: 'boolean',
            description: 'Filter by active status',
          },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findAllTaxRates(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_create_tax_rate',
      description: 'Create a new tax rate.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Tax rate name' },
          rate: {
            type: 'number',
            description: 'Tax rate percentage',
            minimum: 0,
            maximum: 100,
          },
          type: {
            type: 'string',
            description: 'Tax type',
            enum: ['GST', 'VAT', 'SALES_TAX', 'CUSTOM'],
          },
          description: {
            type: 'string',
            description: 'Tax rate description',
          },
          isDefault: {
            type: 'boolean',
            description: 'Whether this is the default tax rate',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the tax rate is active',
          },
        },
        required: ['name', 'rate'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.createTaxRate(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_update_tax_rate',
      description: 'Update an existing tax rate.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Tax rate ID' },
          name: { type: 'string', description: 'Tax rate name' },
          rate: {
            type: 'number',
            description: 'Tax rate percentage',
            minimum: 0,
            maximum: 100,
          },
          type: {
            type: 'string',
            description: 'Tax type',
            enum: ['GST', 'VAT', 'SALES_TAX', 'CUSTOM'],
          },
          description: {
            type: 'string',
            description: 'Tax rate description',
          },
          isDefault: {
            type: 'boolean',
            description: 'Whether this is the default tax rate',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the tax rate is active',
          },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.updateTaxRate(
            params.id,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_delete_tax_rate',
      description: 'Delete a tax rate by its ID.',
      category: ToolCategory.FINANCE,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Tax rate ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.deleteTaxRate(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Expense Categories ────────────────────────────────────
    {
      name: 'finance_list_expense_categories',
      description: 'List expense categories with optional active status filter.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by category name',
          },
          isActive: {
            type: 'boolean',
            description: 'Filter by active status',
          },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result =
            await financeService.findAllExpenseCategories(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_create_expense_category',
      description: 'Create a new expense category.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Category name' },
          description: {
            type: 'string',
            description: 'Category description',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the category is active',
          },
        },
        required: ['name'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.createExpenseCategory(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Expenses ──────────────────────────────────────────────
    {
      name: 'finance_list_expenses',
      description:
        'List and search expenses with optional filters for category, vendor, payment method, and date range.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by description or reference',
          },
          categoryId: {
            type: 'string',
            description: 'Filter by expense category ID',
          },
          vendorId: {
            type: 'string',
            description: 'Filter by vendor ID',
          },
          paymentMethod: {
            type: 'string',
            description: 'Filter by payment method',
            enum: ['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHECK', 'OTHER'],
          },
          reimbursementStatus: {
            type: 'string',
            description: 'Filter by reimbursement status',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED'],
          },
          isReimbursable: {
            type: 'boolean',
            description: 'Filter by reimbursable flag',
          },
          dateRange: {
            type: 'string',
            description: 'Filter by date range',
          },
          currency: {
            type: 'string',
            description: 'Filter by currency code',
          },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findAllExpenses(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_create_expense',
      description: 'Record a new expense.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          categoryId: {
            type: 'string',
            description: 'Expense category ID',
          },
          vendorId: { type: 'string', description: 'Vendor ID' },
          amount: {
            type: 'number',
            description: 'Expense amount',
            minimum: 0.01,
          },
          expenseDate: {
            type: 'string',
            description: 'Expense date (ISO 8601)',
          },
          description: {
            type: 'string',
            description: 'Expense description',
          },
          paymentMethod: {
            type: 'string',
            description: 'Payment method',
            enum: ['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHECK', 'OTHER'],
          },
          referenceNumber: {
            type: 'string',
            description: 'Payment reference number',
          },
          isRecurring: {
            type: 'boolean',
            description: 'Whether the expense is recurring',
          },
          recurringFrequency: {
            type: 'string',
            description: 'Recurring frequency',
            enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
          },
          isReimbursable: {
            type: 'boolean',
            description: 'Whether the expense is reimbursable',
          },
          reimbursementStatus: {
            type: 'string',
            description: 'Reimbursement status',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED'],
          },
          notes: { type: 'string', description: 'Additional notes' },
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD)',
          },
        },
        required: ['amount', 'expenseDate'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.createExpense(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_get_expense',
      description: 'Get an expense by its ID.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Expense ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.findExpenseById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_update_expense',
      description: 'Update an existing expense.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Expense ID' },
          categoryId: {
            type: 'string',
            description: 'Expense category ID',
          },
          vendorId: { type: 'string', description: 'Vendor ID' },
          amount: {
            type: 'number',
            description: 'Expense amount',
            minimum: 0.01,
          },
          expenseDate: {
            type: 'string',
            description: 'Expense date (ISO 8601)',
          },
          description: {
            type: 'string',
            description: 'Expense description',
          },
          paymentMethod: {
            type: 'string',
            description: 'Payment method',
            enum: ['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHECK', 'OTHER'],
          },
          referenceNumber: {
            type: 'string',
            description: 'Payment reference number',
          },
          isRecurring: {
            type: 'boolean',
            description: 'Whether the expense is recurring',
          },
          recurringFrequency: {
            type: 'string',
            description: 'Recurring frequency',
            enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
          },
          isReimbursable: {
            type: 'boolean',
            description: 'Whether the expense is reimbursable',
          },
          reimbursementStatus: {
            type: 'string',
            description: 'Reimbursement status',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED'],
          },
          notes: { type: 'string', description: 'Additional notes' },
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD)',
          },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.updateExpense(
            params.id,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_delete_expense',
      description: 'Delete an expense by its ID.',
      category: ToolCategory.FINANCE,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Expense ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.deleteExpense(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Dashboard & Reports ───────────────────────────────────
    {
      name: 'finance_get_dashboard',
      description:
        'Get finance dashboard statistics including revenue, outstanding, overdue totals, and recent activity.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description:
              'Time period for stats (e.g. this_month, this_quarter, this_year)',
          },
          currency: {
            type: 'string',
            description: 'Currency code filter',
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await financeService.getDashboardStats(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'finance_get_aging_report',
      description:
        'Get accounts receivable aging report showing overdue invoices grouped by aging brackets.',
      category: ToolCategory.FINANCE,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (): Promise<ToolResult> => {
        try {
          const result = await financeService.getAgingReport();
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
