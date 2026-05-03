import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('hr_designations', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    organization_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'organizations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    department_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'hr_departments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  });

  try {
    await queryInterface.addIndex('hr_designations', ['organization_id'], {
      name: 'idx_hr_designations_org',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_designations', ['status'], {
      name: 'idx_hr_designations_status',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('hr_designations', ['department_id'], {
      name: 'idx_hr_designations_department',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  const tableDesc = await queryInterface.describeTable('users') as any;

  if (!tableDesc.department_id) {
    await queryInterface.addColumn('users', 'department_id', {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'hr_departments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (!tableDesc.designation_id) {
    await queryInterface.addColumn('users', 'designation_id', {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'hr_designations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDesc = await queryInterface.describeTable('users') as any;
  if (tableDesc.department_id) await queryInterface.removeColumn('users', 'department_id');
  if (tableDesc.designation_id) await queryInterface.removeColumn('users', 'designation_id');
  await queryInterface.dropTable('hr_designations');
};
