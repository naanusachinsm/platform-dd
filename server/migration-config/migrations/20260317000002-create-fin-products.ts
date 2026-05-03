import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('fin_products', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('PRODUCT', 'SERVICE'),
      allowNull: false,
      defaultValue: 'SERVICE',
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tax_rate_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'fin_tax_rates', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  });

  try {
    await queryInterface.addIndex('fin_products', ['organization_id'], {
      name: 'idx_fin_products_org',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_products', ['organization_id', 'name'], {
      name: 'idx_fin_products_org_name',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_products', ['type'], {
      name: 'idx_fin_products_type',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('fin_products');
};
