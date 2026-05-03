import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('agent_user_memories', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    organization_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'organizations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    category: {
      type: DataTypes.ENUM('PREFERENCE', 'SHORTCUT', 'FACT', 'PATTERN', 'CONTEXT'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    source_conversation_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    relevance_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    last_accessed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  });

  const userMemoryIndexes = [
    { fields: ['user_id'], name: 'idx_agent_user_memories_user' },
    { fields: ['organization_id'], name: 'idx_agent_user_memories_org' },
    { fields: ['user_id', 'category'], name: 'idx_agent_user_memories_user_cat' },
    { fields: ['relevance_score'], name: 'idx_agent_user_memories_score' },
  ];

  for (const idx of userMemoryIndexes) {
    try {
      await queryInterface.addIndex('agent_user_memories', idx.fields, { name: idx.name });
    } catch (error: any) {
      if (!error.message?.includes('Duplicate key name')) throw error;
    }
  }

  await queryInterface.createTable('agent_org_memories', {
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
    category: {
      type: DataTypes.ENUM('TERMINOLOGY', 'WORKFLOW', 'BUSINESS_RULE', 'KNOWLEDGE'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    relevance_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    last_accessed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  });

  const orgMemoryIndexes = [
    { fields: ['organization_id'], name: 'idx_agent_org_memories_org' },
    { fields: ['organization_id', 'category'], name: 'idx_agent_org_memories_org_cat' },
    { fields: ['relevance_score'], name: 'idx_agent_org_memories_score' },
  ];

  for (const idx of orgMemoryIndexes) {
    try {
      await queryInterface.addIndex('agent_org_memories', idx.fields, { name: idx.name });
    } catch (error: any) {
      if (!error.message?.includes('Duplicate key name')) throw error;
    }
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('agent_user_memories');
  await queryInterface.dropTable('agent_org_memories');
};
