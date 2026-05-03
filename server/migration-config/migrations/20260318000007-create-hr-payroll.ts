import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('hr_payroll', {
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
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    basic_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    allowances: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    deductions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    gross_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    net_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PROCESSED', 'PAID'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    paid_at: {
      type: DataTypes.DATEONLY,
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
    await queryInterface.addIndex('hr_payroll', ['organization_id'], {
      name: 'idx_hr_payroll_org',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_payroll', ['user_id'], {
      name: 'idx_hr_payroll_user',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_payroll', ['status'], {
      name: 'idx_hr_payroll_status',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_payroll', ['user_id', 'month', 'year'], {
      unique: true,
      name: 'unique_hr_payroll_user_month_year',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('hr_payroll');
};
