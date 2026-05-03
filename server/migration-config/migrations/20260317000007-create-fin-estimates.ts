import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('fin_estimates', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    organization_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'organizations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    estimate_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    crm_company_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'crm_companies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    crm_contact_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'crm_contacts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    crm_deal_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'crm_deals', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    valid_until: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_type: {
      type: DataTypes.ENUM('PERCENTAGE', 'FIXED'),
      allowNull: true,
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    terms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customer_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    converted_invoice_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'fin_invoices', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    viewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  });

  try {
    await queryInterface.addIndex('fin_estimates', ['organization_id'], {
      name: 'idx_fin_estimates_org',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_estimates', ['organization_id', 'estimate_number'], {
      name: 'idx_fin_estimates_org_number',
      unique: true,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_estimates', ['status'], {
      name: 'idx_fin_estimates_status',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_estimates', ['crm_company_id'], {
      name: 'idx_fin_estimates_company',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('fin_estimates');
};
