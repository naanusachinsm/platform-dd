import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('fin_expenses', {
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
    category_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'fin_expense_categories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    vendor_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'fin_vendors', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receipt_asset_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'assets', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    payment_method: {
      type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHECK', 'OTHER'),
      allowNull: true,
    },
    reference_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurring_frequency: {
      type: DataTypes.ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'),
      allowNull: true,
    },
    is_reimbursable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reimbursement_status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED'),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  });

  try {
    await queryInterface.addIndex('fin_expenses', ['organization_id'], {
      name: 'idx_fin_expenses_org',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_expenses', ['category_id'], {
      name: 'idx_fin_expenses_category',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_expenses', ['vendor_id'], {
      name: 'idx_fin_expenses_vendor',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_expenses', ['expense_date'], {
      name: 'idx_fin_expenses_date',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('fin_expenses');
};
