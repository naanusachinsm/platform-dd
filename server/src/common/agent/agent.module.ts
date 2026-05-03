import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AgentController } from './agent.controller';
import { AgentService } from './services/agent.service';
import { ToolRegistryService } from './services/tool-registry.service';
import { ConversationStoreService } from './services/conversation-store.service';
import { MemoryService } from './services/memory.service';
import { AgentUserMemory } from './entities/agent-user-memory.entity';
import { AgentOrgMemory } from './entities/agent-org-memory.entity';
import { CommonModule } from 'src/common/common.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    CommonModule,
    SequelizeModule.forFeature([AgentUserMemory, AgentOrgMemory]),
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    ToolRegistryService,
    ConversationStoreService,
    MemoryService,
  ],
  exports: [AgentService, ToolRegistryService],
})
export class AgentModule {}
