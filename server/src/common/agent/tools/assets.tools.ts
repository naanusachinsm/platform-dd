import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
} from '../interfaces/tool.interface';
import { AssetsService } from 'src/resources/assets/assets.service';

export function createAssetsTools(
  assetsService: AssetsService,
): ToolDefinition[] {
  return [
    {
      name: 'assets_list',
      description:
        'List assets with optional search, type filter, and pagination',
      category: ToolCategory.ASSETS,
      inputSchema: {
        type: 'object',
        properties: {
          searchTerm: {
            type: 'string',
            description: 'Search term to filter assets by name',
          },
          type: {
            type: 'string',
            description: 'Filter by asset type',
          },
          page: { type: 'integer', description: 'Page number', default: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            default: 10,
          },
        },
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await assetsService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'assets_get',
      description: 'Get a specific asset by ID',
      category: ToolCategory.ASSETS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Asset ID' },
        },
        required: ['id'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await assetsService.findById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'assets_delete',
      description: 'Delete an asset by ID',
      category: ToolCategory.ASSETS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Asset ID to delete' },
        },
        required: ['id'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await assetsService.remove(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
