import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('tickets', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    organization_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    project_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    ticket_key: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ticket_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('EPIC', 'STORY', 'TASK', 'BUG'),
      allowNull: false,
      defaultValue: 'TASK',
    },
    priority: {
      type: DataTypes.ENUM('HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    column_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'board_columns',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    assignee_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    reporter_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    sprint_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'sprints',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    parent_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'tickets',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    resolution: {
      type: DataTypes.ENUM('UNRESOLVED', 'DONE', 'WONT_DO', 'DUPLICATE', 'CANNOT_REPRODUCE'),
      allowNull: false,
      defaultValue: 'UNRESOLVED',
    },
    story_points: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    labels: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW(),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW(),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
  });

  try {
    await queryInterface.addIndex('tickets', ['project_id', 'ticket_key'], {
      unique: true,
      name: 'unique_ticket_key',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('tickets', ['project_id', 'column_id', 'position'], {
      name: 'idx_tickets_project_column_position',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('tickets', ['project_id', 'sprint_id'], {
      name: 'idx_tickets_project_sprint',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('tickets', ['project_id', 'assignee_id'], {
      name: 'idx_tickets_project_assignee',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('tickets', ['project_id', 'type'], {
      name: 'idx_tickets_project_type',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }

  try {
    await queryInterface.addIndex('tickets', ['parent_id'], {
      name: 'idx_tickets_parent',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name')) throw error;
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('tickets');
};
