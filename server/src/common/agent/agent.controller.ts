import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AgentService } from './services/agent.service';
import { MemoryService } from './services/memory.service';
import { AgentChatDto, ConfirmActionDto, MemoryQueryDto } from './dto/agent-chat.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller()
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly memoryService: MemoryService,
  ) {}

  @Post('chat')
  chat(@Body() dto: AgentChatDto) {
    return this.agentService.chat({
      message: dto.message,
      conversationId: dto.conversationId,
    });
  }

  @Post('conversations/:id/confirm')
  confirmAction(
    @Param('id') id: string,
    @Body() dto: ConfirmActionDto,
  ) {
    return this.agentService.confirmAction(id, dto.confirmed);
  }

  @Get('conversations/:id/history')
  getHistory(@Param('id') id: string) {
    return this.agentService.getHistory(id);
  }

  @Delete('conversations/:id')
  clearConversation(@Param('id') id: string) {
    return this.agentService.clearConversation(id);
  }

  @Get('tools')
  listAvailableTools() {
    return this.agentService.getAvailableTools();
  }

  @Get('memories')
  listMemories(@CurrentUser() user: any, @Query() query: MemoryQueryDto) {
    return this.memoryService.listUserMemories(user.sub || user.id, query.category);
  }

  @Delete('memories/:id')
  deleteMemory(@Param('id') id: string) {
    return this.memoryService.deleteUserMemory(id);
  }

  @Get('memories/org')
  listOrgMemories(@CurrentUser() user: any) {
    return this.memoryService.listOrgMemories(user.organizationId);
  }
}
