import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDesc = await queryInterface.describeTable('fin_estimates') as any;
  if (!tableDesc.version) {
    await queryInterface.addColumn('fin_estimates', 'version', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeColumn('fin_estimates', 'version');
};
