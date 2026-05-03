import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CrmService } from './crm.service';
import { CrmActivityTrackerService } from './services/crm-activity-tracker.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateDealDto, UpdateDealStageDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import {
  CompanyQueryDto,
  ContactQueryDto,
  DealQueryDto,
  ActivityQueryDto,
} from './dto/crm-query.dto';

@Controller()
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly activityTracker: CrmActivityTrackerService,
  ) {}

  // ─── Companies ──────────────────────────────────────────

  @Post('companies')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.crmService.createCompany(dto);
  }

  @Get('companies')
  findAllCompanies(@Query() query: CompanyQueryDto) {
    return this.crmService.findAllCompanies(query);
  }

  @Get('companies/:id')
  findCompanyById(@Param('id') id: string) {
    return this.crmService.findCompanyById(id);
  }

  @Patch('companies/:id')
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.crmService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  deleteCompany(@Param('id') id: string) {
    return this.crmService.deleteCompany(id);
  }

  // ─── Contacts ──────────────────────────────────────────

  @Post('contacts')
  createContact(@Body() dto: CreateContactDto) {
    return this.crmService.createContact(dto);
  }

  @Get('contacts')
  findAllContacts(@Query() query: ContactQueryDto) {
    return this.crmService.findAllContacts(query);
  }

  @Get('contacts/:id')
  findContactById(@Param('id') id: string) {
    return this.crmService.findContactById(id);
  }

  @Patch('contacts/:id')
  updateContact(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.crmService.updateContact(id, dto);
  }

  @Delete('contacts/:id')
  deleteContact(@Param('id') id: string) {
    return this.crmService.deleteContact(id);
  }

  // ─── Deals ──────────────────────────────────────────

  @Post('deals')
  createDeal(@Body() dto: CreateDealDto) {
    return this.crmService.createDeal(dto);
  }

  @Get('deals')
  findAllDeals(@Query() query: DealQueryDto) {
    return this.crmService.findAllDeals(query);
  }

  @Get('deals/pipeline')
  getDealsPipeline(
    @Query('organizationId') organizationId?: string,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.crmService.getDealsPipeline(organizationId, dateRange);
  }

  @Get('deals/:id')
  findDealById(@Param('id') id: string) {
    return this.crmService.findDealById(id);
  }

  @Patch('deals/:id')
  updateDeal(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.crmService.updateDeal(id, dto);
  }

  @Patch('deals/:id/stage')
  updateDealStage(@Param('id') id: string, @Body() dto: UpdateDealStageDto) {
    return this.crmService.updateDealStage(id, dto);
  }

  @Delete('deals/:id')
  deleteDeal(@Param('id') id: string) {
    return this.crmService.deleteDeal(id);
  }

  // ─── Activities ──────────────────────────────────────────

  @Post('activities')
  createActivity(@Body() dto: CreateActivityDto) {
    return this.crmService.createActivity(dto);
  }

  @Get('activities')
  findAllActivities(@Query() query: ActivityQueryDto) {
    return this.crmService.findAllActivities(query);
  }

  @Get('activities/:id')
  findActivityById(@Param('id') id: string) {
    return this.crmService.findActivityById(id);
  }

  @Patch('activities/:id')
  updateActivity(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.crmService.updateActivity(id, dto);
  }

  @Delete('activities/:id')
  deleteActivity(@Param('id') id: string) {
    return this.crmService.deleteActivity(id);
  }

  // ─── Activities Log ──────────────────────────────────────────

  @Get('activities-log')
  getActivitiesLog(@Query() query: { page?: string; limit?: string; entityType?: string }) {
    return this.activityTracker.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      entityType: query.entityType,
    });
  }

  // ─── Dashboard ──────────────────────────────────────────

  @Get('dashboard')
  getDashboardStats(@Query('organizationId') organizationId?: string) {
    return this.crmService.getDashboardStats(organizationId);
  }

  // ─── CSV Import ──────────────────────────────────────────

  @Post('import/contacts')
  @UseInterceptors(FileInterceptor('file'))
  async importContacts(@UploadedFile() file: any, @Body('data') dataStr?: string) {
    let rows: Record<string, string>[];
    if (file) {
      rows = this.parseCsv(file.buffer.toString('utf-8'));
    } else if (dataStr) {
      rows = JSON.parse(dataStr);
    } else {
      throw new BadRequestException('No file or data provided');
    }
    return this.crmService.importContacts(rows);
  }

  @Post('import/companies')
  @UseInterceptors(FileInterceptor('file'))
  async importCompanies(@UploadedFile() file: any, @Body('data') dataStr?: string) {
    let rows: Record<string, string>[];
    if (file) {
      rows = this.parseCsv(file.buffer.toString('utf-8'));
    } else if (dataStr) {
      rows = JSON.parse(dataStr);
    } else {
      throw new BadRequestException('No file or data provided');
    }
    return this.crmService.importCompanies(rows);
  }

  private parseCsv(content: string): Record<string, string>[] {
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
  }
}
