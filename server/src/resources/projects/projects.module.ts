import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { BoardColumn } from './entities/board-column.entity';
import { Sprint } from './entities/sprint.entity';
import { Ticket } from './entities/ticket.entity';
import { Board } from './entities/board.entity';
import { ProjectActivity } from './entities/project-activity.entity';
import { TicketComment } from './entities/ticket-comment.entity';
import { ProjectAsset } from './entities/project-asset.entity';
import { User } from 'src/resources/users/entities/user.entity';
import { ProjectsController } from './projects.controller';
import { ProjectService } from './services/project.service';
import { BoardColumnService } from './services/board-column.service';
import { SprintService } from './services/sprint.service';
import { TicketService } from './services/ticket.service';
import { ProjectActivityService } from './services/project-activity.service';
import { ProjectRepository } from './project.repository';
import { ProjectMemberRepository } from './project-member.repository';
import { BoardColumnRepository } from './board-column.repository';
import { SprintRepository } from './sprint.repository';
import { TicketRepository } from './ticket.repository';
import { BoardService } from './services/board.service';
import { BoardRepository } from './board.repository';
import { ProjectActivityRepository } from './project-activity.repository';
import { TicketCommentService } from './services/ticket-comment.service';
import { TicketCommentRepository } from './ticket-comment.repository';
import { ProjectAssetService } from './services/project-asset.service';
import { ProjectAssetRepository } from './project-asset.repository';
import { TicketNotificationService } from './services/ticket-notification.service';
import { ProjectAiService } from './services/project-ai.service';
import { ProjectMemberGuard } from './guards/project-member.guard';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Project,
      ProjectMember,
      BoardColumn,
      Sprint,
      Ticket,
      Board,
      ProjectActivity,
      TicketComment,
      ProjectAsset,
      User,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectService,
    BoardColumnService,
    SprintService,
    TicketService,
    ProjectActivityService,
    ProjectRepository,
    ProjectMemberRepository,
    BoardColumnRepository,
    SprintRepository,
    TicketRepository,
    BoardService,
    BoardRepository,
    ProjectActivityRepository,
    TicketCommentService,
    TicketCommentRepository,
    ProjectAssetService,
    ProjectAssetRepository,
    TicketNotificationService,
    ProjectAiService,
    ProjectMemberGuard,
  ],
  exports: [
    ProjectService,
    BoardColumnService,
    SprintService,
    TicketService,
    BoardService,
    ProjectActivityService,
  ],
})
export class ProjectsModule {}
