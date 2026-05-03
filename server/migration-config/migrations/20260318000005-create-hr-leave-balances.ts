import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('hr_leave_balances', {
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
    leave_type_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'hr_leave_types', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_days: {
      type: DataTypes.DECIMAL(5, 1),
      allowNull: false,
      defaultValue: 0,
    },
    used_days: {
      type: DataTypes.DECIMAL(5, 1),
      allowNull: false,
      defaultValue: 0,
    },
    remaining_days: {
      type: DataTypes.DECIMAL(5, 1),
      allowNull: false,
      defaultValue: 0,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  });

  try {
    await queryInterface.addIndex('hr_leave_balances', ['organization_id'], {
      name: 'idx_hr_leave_balances_org',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_leave_balances', ['user_id'], {
      name: 'idx_hr_leave_balances_user',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_leave_balances', ['leave_type_id'], {
      name: 'idx_hr_leave_balances_leave_type',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_leave_balances', ['year'], {
      name: 'idx_hr_leave_balances_year',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_leave_balances', ['user_id', 'leave_type_id', 'year'], {
      unique: true,
      name: 'unique_hr_leave_balances_user_type_year',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('hr_leave_balances');
};
