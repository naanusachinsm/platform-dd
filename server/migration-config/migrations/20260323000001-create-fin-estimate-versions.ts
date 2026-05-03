import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('fin_estimate_versions', {
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
    estimate_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'fin_estimates', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    snapshot: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW() },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  });

  try {
    await queryInterface.addIndex('fin_estimate_versions', ['estimate_id', 'version'], {
      name: 'idx_fin_estimate_versions_est_ver',
      unique: true,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('fin_estimate_versions', ['organization_id'], {
      name: 'idx_fin_estimate_versions_org',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('fin_estimate_versions');
};
