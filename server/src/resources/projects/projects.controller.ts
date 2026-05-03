import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { SprintService } from './services/sprint.service';
import { TicketService } from './services/ticket.service';
import { BoardColumnService } from './services/board-column.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateBoardColumnDto, UpdateBoardColumnDto, ReorderColumnsDto } from './dto/create-board-column.dto';
import { CreateSprintDto, UpdateSprintDto } from './dto/create-sprint.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { MoveTicketDto, AssignTicketDto } from './dto/move-ticket.dto';
import { BoardService } from './services/board.service';
import { CreateBoardDto, UpdateBoardDto } from './dto/create-board.dto';
import { ProjectActivityService } from './services/project-activity.service';
import { TicketCommentService } from './services/ticket-comment.service';
import { CreateTicketCommentDto, UpdateTicketCommentDto } from './dto/ticket-comment.dto';
import { ProjectAssetService } from './services/project-asset.service';
import { ProjectAiService } from './services/project-ai.service';
import { CreateProjectAssetDto } from './dto/create-project-asset.dto';
import { AiEnhanceTicketDto } from './dto/ai-enhance-ticket.dto';
import { AiParseTicketDto } from './dto/ai-parse-ticket.dto';
import { AiDetectDuplicatesDto } from './dto/ai-detect-duplicates.dto';
import { AiChatDto } from './dto/ai-chat.dto';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { ProjectAdminOnly } from './guards/project-admin-only.decorator';

@Controller()
@UseGuards(ProjectMemberGuard)
export class ProjectsController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly sprintService: SprintService,
    private readonly ticketService: TicketService,
    private readonly boardColumnService: BoardColumnService,
    private readonly boardService: BoardService,
    private readonly userContextService: UserContextService,
    private readonly projectActivityService: ProjectActivityService,
    private readonly ticketCommentService: TicketCommentService,
    private readonly projectAssetService: ProjectAssetService,
    private readonly projectAiService: ProjectAiService,
  ) {}

  // ─── Projects (non-parameterized) ───────────────────────

  @Get()
  findAllProjects(@Query() query: ProjectQueryDto) {
    return this.projectService.findAll(query);
  }

  @Post()
  createProject(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @Get('by-key/:key')
  findProjectByKey(@Param('key') key: string) {
    return this.projectService.findByKey(key.toUpperCase());
  }

  // ─── Board Columns (org-level, before :projectId) ──────

  @Get('columns/list')
  getColumns() {
    const user = this.userContextService.getCurrentUser();
    return this.boardColumnService.findAll(user?.organizationId);
  }

  @Post('columns')
  createColumn(@Body() dto: CreateBoardColumnDto) {
    return this.boardColumnService.create(dto);
  }

  @Put('columns/reorder')
  reorderColumns(@Body() dto: ReorderColumnsDto) {
    return this.boardColumnService.reorder(dto);
  }

  @Put('columns/:id')
  updateColumn(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBoardColumnDto) {
    return this.boardColumnService.update(id, dto);
  }

  @Delete('columns/:id')
  removeColumn(@Param('id', ParseUUIDPipe) id: string) {
    return this.boardColumnService.remove(id);
  }

  // ─── Projects (parameterized) ──────────────────────────

  @Get(':projectId')
  findOneProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectService.findOne(projectId);
  }

  @Put(':projectId')
  @ProjectAdminOnly()
  updateProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(projectId, dto);
  }

  @Delete(':projectId')
  @ProjectAdminOnly()
  removeProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectService.remove(projectId);
  }

  // ─── Project Members ──────────────────────────────────

  @Get(':projectId/members')
  getMembers(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectService.getMembers(projectId);
  }

  @Post(':projectId/members')
  @ProjectAdminOnly()
  addMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectService.addMember(projectId, dto);
  }

  @Delete(':projectId/members/:userId')
  @ProjectAdminOnly()
  removeMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.projectService.removeMember(projectId, userId);
  }

  // ─── Sprints ──────────────────────────────────────────

  @Get(':projectId/sprints')
  findAllSprints(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.sprintService.findAll(projectId);
  }

  @Post(':projectId/sprints')
  @ProjectAdminOnly()
  createSprint(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprintService.create(projectId, dto);
  }

  @Put(':projectId/sprints/:id')
  @ProjectAdminOnly()
  updateSprint(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintService.update(projectId, id, dto);
  }

  @Put(':projectId/sprints/:id/start')
  @ProjectAdminOnly()
  startSprint(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sprintService.start(projectId, id);
  }

  @Put(':projectId/sprints/:id/complete')
  @ProjectAdminOnly()
  completeSprint(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sprintService.complete(projectId, id);
  }

  @Delete(':projectId/sprints/:id')
  @ProjectAdminOnly()
  removeSprint(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sprintService.remove(projectId, id);
  }

  // ─── Tickets ──────────────────────────────────────────

  @Get(':projectId/tickets')
  findAllTickets(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: TicketQueryDto,
  ) {
    return this.ticketService.findAll(projectId, query);
  }

  @Post(':projectId/tickets')
  createTicket(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketService.create(projectId, dto);
  }

  @Get(':projectId/tickets/by-number/:ticketNumber')
  findTicketByNumber(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('ticketNumber', ParseIntPipe) ticketNumber: number,
  ) {
    return this.ticketService.findByKey(projectId, ticketNumber);
  }

  @Get(':projectId/tickets/:id')
  findOneTicket(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketService.findOne(projectId, id);
  }

  @Put(':projectId/tickets/:id')
  updateTicket(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketService.update(projectId, id, dto);
  }

  @Delete(':projectId/tickets/:id')
  removeTicket(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketService.remove(projectId, id);
  }

  @Put(':projectId/tickets/:id/move')
  moveTicket(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveTicketDto,
  ) {
    return this.ticketService.moveTicket(projectId, id, dto);
  }

  @Put(':projectId/tickets/:id/assign')
  assignTicket(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.ticketService.assignTicket(projectId, id, dto);
  }

  // ─── Ticket Comments ────────────────────────────────

  @Get(':projectId/tickets/:ticketId/comments')
  findAllComments(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ) {
    return this.ticketCommentService.findAll(projectId, ticketId);
  }

  @Post(':projectId/tickets/:ticketId/comments')
  createComment(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() dto: CreateTicketCommentDto,
  ) {
    return this.ticketCommentService.create(projectId, ticketId, dto);
  }

  @Put(':projectId/tickets/:ticketId/comments/:commentId')
  updateComment(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateTicketCommentDto,
  ) {
    return this.ticketCommentService.update(projectId, commentId, dto);
  }

  @Delete(':projectId/tickets/:ticketId/comments/:commentId')
  removeComment(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.ticketCommentService.remove(projectId, commentId);
  }

  // ─── Boards ────────────────────────────────────────

  @Get(':projectId/boards')
  findAllBoards(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.boardService.findAll(projectId);
  }

  @Post(':projectId/boards')
  createBoard(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardService.create(projectId, dto);
  }

  @Put(':projectId/boards/:boardId')
  updateBoard(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardService.update(projectId, boardId, dto);
  }

  @Delete(':projectId/boards/:boardId')
  removeBoard(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('boardId', ParseUUIDPipe) boardId: string,
  ) {
    return this.boardService.remove(projectId, boardId);
  }

  @Get(':projectId/boards/:boardId/data')
  async getBoardDataById(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('boardId', ParseUUIDPipe) boardId: string,
  ) {
    const board = await this.boardService.findOne(projectId, boardId) as any;
    return this.ticketService.getBoardData(projectId, {
      filterSprintId: board.filterSprintId || undefined,
      filterType: board.filterType || undefined,
      filterPriority: board.filterPriority || undefined,
      filterAssigneeId: board.filterAssigneeId || undefined,
      filterLabels: board.filterLabels || undefined,
    });
  }

  // ─── Summary & Activity ────────────────────────────────

  @Get(':projectId/summary')
  getProjectSummary(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.ticketService.getProjectSummary(projectId);
  }

  @Get(':projectId/activity')
  getProjectActivity(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const parsedLimit = limit ? Math.min(100, Math.max(1, parseInt(limit, 10) || 20)) : 20;
    return this.projectActivityService.findAll(projectId, parsedPage, parsedLimit);
  }

  // ─── Board & Backlog Views ────────────────────────────

  @Get(':projectId/board')
  getBoardData(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.ticketService.getBoardData(projectId);
  }

  @Get(':projectId/backlog')
  getBacklogData(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.ticketService.getBacklogData(projectId);
  }

  // ─── Project Assets ────────────────────────────────

  @Get(':projectId/assets')
  findAllAssets(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectAssetService.findAll(projectId);
  }

  @Post(':projectId/assets')
  createAsset(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProjectAssetDto,
  ) {
    return this.projectAssetService.create(projectId, dto);
  }

  @Delete(':projectId/assets/:assetId')
  removeAsset(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    return this.projectAssetService.remove(projectId, assetId);
  }

  // ─── AI Features ──────────────────────────────────────

  @Post(':projectId/ai/enhance-ticket')
  enhanceTicket(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AiEnhanceTicketDto,
  ) {
    return this.projectAiService.enhanceTicket(projectId, dto);
  }

  @Post(':projectId/ai/parse-ticket')
  parseTicketFromText(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AiParseTicketDto,
  ) {
    return this.projectAiService.parseTicketFromText(projectId, dto);
  }

  @Post(':projectId/ai/detect-duplicates')
  detectDuplicates(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AiDetectDuplicatesDto,
  ) {
    return this.projectAiService.detectDuplicates(projectId, dto);
  }

  @Post(':projectId/ai/summarize-comments/:ticketId')
  summarizeComments(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ) {
    return this.projectAiService.summarizeComments(projectId, ticketId);
  }

  @Post(':projectId/ai/decompose/:ticketId')
  decomposeEpic(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ) {
    return this.projectAiService.decomposeEpic(projectId, ticketId);
  }

  @Post(':projectId/ai/sprint-insights/:sprintId')
  sprintInsights(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('sprintId', ParseUUIDPipe) sprintId: string,
  ) {
    return this.projectAiService.getSprintInsights(projectId, sprintId);
  }

  @Post(':projectId/ai/risk-analysis')
  riskAnalysis(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectAiService.analyzeRisks(projectId);
  }

  @Post(':projectId/ai/chat')
  aiChat(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AiChatDto,
  ) {
    return this.projectAiService.chat(projectId, dto);
  }

}
