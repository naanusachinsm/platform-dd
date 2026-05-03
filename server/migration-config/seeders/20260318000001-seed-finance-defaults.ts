import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();

    const [organizations] = await queryInterface.sequelize.query(
      'SELECT id FROM organizations WHERE deleted_at IS NULL',
    ) as any[];

    if (!organizations.length) return;

    const gstRates = [
      { name: 'GST 0% (Exempt)', rate: 0, description: 'Exempt from GST' },
      { name: 'GST 5%', rate: 5, description: 'GST at 5%' },
      { name: 'GST 12%', rate: 12, description: 'GST at 12%' },
      { name: 'GST 18%', rate: 18, description: 'GST at 18%' },
      { name: 'GST 28%', rate: 28, description: 'GST at 28%' },
    ];

    const expenseCategories = [
      { name: 'Rent & Lease', description: 'Office rent, warehouse lease, and other property rentals' },
      { name: 'Utilities', description: 'Electricity, water, internet, and phone bills' },
      { name: 'Office Supplies', description: 'Stationery, printing, and general office supplies' },
      { name: 'Travel & Transport', description: 'Business travel, fuel, and transportation costs' },
      { name: 'Meals & Entertainment', description: 'Client meals, team outings, and entertainment' },
      { name: 'Professional Services', description: 'Legal, accounting, and consulting fees' },
      { name: 'Software & Subscriptions', description: 'SaaS subscriptions, licenses, and tools' },
      { name: 'Marketing & Advertising', description: 'Ads, promotions, and marketing campaigns' },
      { name: 'Insurance', description: 'Business, health, and liability insurance premiums' },
      { name: 'Miscellaneous', description: 'Other uncategorized expenses' },
    ];

    for (const org of organizations) {
      const orgId = (org as any).id;

      const [existingRates] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as cnt FROM fin_tax_rates WHERE organization_id = '${orgId}' AND deleted_at IS NULL`,
      ) as any[];
      if (parseInt(existingRates[0].cnt, 10) === 0) {
        await queryInterface.bulkInsert(
          'fin_tax_rates',
          gstRates.map((r) => ({
            id: uuidv4(),
            organization_id: orgId,
            name: r.name,
            rate: r.rate,
            type: 'GST',
            description: r.description,
            is_default: true,
            is_active: true,
            created_at: now,
            updated_at: now,
          })),
        );
      }

      const [existingCategories] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as cnt FROM fin_expense_categories WHERE organization_id = '${orgId}' AND deleted_at IS NULL`,
      ) as any[];
      if (parseInt(existingCategories[0].cnt, 10) === 0) {
        await queryInterface.bulkInsert(
          'fin_expense_categories',
          expenseCategories.map((c) => ({
            id: uuidv4(),
            organization_id: orgId,
            name: c.name,
            description: c.description,
            is_active: true,
            created_at: now,
            updated_at: now,
          })),
        );
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('fin_tax_rates', { is_default: true } as any);
    await queryInterface.bulkDelete('fin_expense_categories', {} as any);
  },
};
