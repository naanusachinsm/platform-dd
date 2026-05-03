import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateHrDepartmentDto } from './departments/dto/create-hr-department.dto';
import { UpdateHrDepartmentDto } from './departments/dto/update-hr-department.dto';
import { HrDepartmentQueryDto } from './departments/dto/hr-department-query.dto';
import { CreateHrDesignationDto } from './designations/dto/create-hr-designation.dto';
import { UpdateHrDesignationDto } from './designations/dto/update-hr-designation.dto';
import { HrDesignationQueryDto } from './designations/dto/hr-designation-query.dto';
import { CreateHrLeaveTypeDto } from './leave/dto/create-hr-leave-type.dto';
import { UpdateHrLeaveTypeDto } from './leave/dto/update-hr-leave-type.dto';
import { HrLeaveTypeQueryDto } from './leave/dto/hr-leave-type-query.dto';
import { CreateHrLeaveRequestDto } from './leave/dto/create-hr-leave-request.dto';
import { UpdateHrLeaveRequestDto } from './leave/dto/update-hr-leave-request.dto';
import { HrLeaveQueryDto } from './leave/dto/hr-leave-query.dto';
import { CreateHrLeaveBalanceDto } from './leave/dto/create-hr-leave-balance.dto';
import { HrLeaveBalanceQueryDto } from './leave/dto/hr-leave-balance-query.dto';
import { CreateHrAttendanceDto } from './attendance/dto/create-hr-attendance.dto';
import { UpdateHrAttendanceDto } from './attendance/dto/update-hr-attendance.dto';
import { HrAttendanceQueryDto } from './attendance/dto/hr-attendance-query.dto';
import { CreateHrPayrollDto } from './payroll/dto/create-hr-payroll.dto';
import { UpdateHrPayrollDto } from './payroll/dto/update-hr-payroll.dto';
import { HrPayrollQueryDto } from './payroll/dto/hr-payroll-query.dto';
import { CreateHrAnnouncementDto } from './announcements/dto/create-hr-announcement.dto';
import { UpdateHrAnnouncementDto } from './announcements/dto/update-hr-announcement.dto';
import { HrAnnouncementQueryDto } from './announcements/dto/hr-announcement-query.dto';
import { CreateHrDocumentDto } from './documents/dto/create-hr-document.dto';
import { UpdateHrDocumentDto } from './documents/dto/update-hr-document.dto';
import { HrDocumentQueryDto } from './documents/dto/hr-document-query.dto';

@Controller()
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ─── Dashboard ──────────────────────────────────────────

  @Get('dashboard')
  getDashboardStats(@Query('organizationId') organizationId?: string) {
    return this.hrService.getDashboardStats(organizationId);
  }

  // ─── Departments ──────────────────────────────────────────

  @Post('departments')
  createDepartment(@Body() dto: CreateHrDepartmentDto) {
    return this.hrService.createDepartment(dto);
  }

  @Get('departments')
  findAllDepartments(@Query() query: HrDepartmentQueryDto) {
    return this.hrService.findAllDepartments(query);
  }

  @Get('departments/:id')
  findDepartmentById(@Param('id') id: string) {
    return this.hrService.findDepartmentById(id);
  }

  @Patch('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() dto: UpdateHrDepartmentDto) {
    return this.hrService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  deleteDepartment(@Param('id') id: string) {
    return this.hrService.deleteDepartment(id);
  }

  // ─── Designations ──────────────────────────────────────────

  @Post('designations')
  createDesignation(@Body() dto: CreateHrDesignationDto) {
    return this.hrService.createDesignation(dto);
  }

  @Get('designations')
  findAllDesignations(@Query() query: HrDesignationQueryDto) {
    return this.hrService.findAllDesignations(query);
  }

  @Get('designations/:id')
  findDesignationById(@Param('id') id: string) {
    return this.hrService.findDesignationById(id);
  }

  @Patch('designations/:id')
  updateDesignation(@Param('id') id: string, @Body() dto: UpdateHrDesignationDto) {
    return this.hrService.updateDesignation(id, dto);
  }

  @Delete('designations/:id')
  deleteDesignation(@Param('id') id: string) {
    return this.hrService.deleteDesignation(id);
  }

  // ─── Leave Types ──────────────────────────────────────────

  @Post('leave-types')
  createLeaveType(@Body() dto: CreateHrLeaveTypeDto) {
    return this.hrService.createLeaveType(dto);
  }

  @Get('leave-types')
  findAllLeaveTypes(@Query() query: HrLeaveTypeQueryDto) {
    return this.hrService.findAllLeaveTypes(query);
  }

  @Get('leave-types/:id')
  findLeaveTypeById(@Param('id') id: string) {
    return this.hrService.findLeaveTypeById(id);
  }

  @Patch('leave-types/:id')
  updateLeaveType(@Param('id') id: string, @Body() dto: UpdateHrLeaveTypeDto) {
    return this.hrService.updateLeaveType(id, dto);
  }

  @Delete('leave-types/:id')
  deleteLeaveType(@Param('id') id: string) {
    return this.hrService.deleteLeaveType(id);
  }

  // ─── Leave Requests ──────────────────────────────────────────

  @Post('leave-requests')
  createLeaveRequest(@Body() dto: CreateHrLeaveRequestDto) {
    return this.hrService.createLeaveRequest(dto);
  }

  @Get('leave-requests')
  findAllLeaveRequests(@Query() query: HrLeaveQueryDto) {
    return this.hrService.findAllLeaveRequests(query);
  }

  @Get('leave-requests/:id')
  findLeaveRequestById(@Param('id') id: string) {
    return this.hrService.findLeaveRequestById(id);
  }

  @Patch('leave-requests/:id')
  updateLeaveRequest(@Param('id') id: string, @Body() dto: UpdateHrLeaveRequestDto) {
    return this.hrService.updateLeaveRequest(id, dto);
  }

  @Delete('leave-requests/:id')
  deleteLeaveRequest(@Param('id') id: string) {
    return this.hrService.deleteLeaveRequest(id);
  }

  // ─── Leave Balances ──────────────────────────────────────────

  @Get('leave-balances')
  findLeaveBalances(@Query() query: HrLeaveBalanceQueryDto) {
    return this.hrService.findLeaveBalances(query);
  }

  @Post('leave-balances')
  createLeaveBalance(@Body() dto: CreateHrLeaveBalanceDto) {
    return this.hrService.createLeaveBalance(dto);
  }

  // ─── Attendance ──────────────────────────────────────────

  @Post('attendance')
  createAttendance(@Body() dto: CreateHrAttendanceDto) {
    return this.hrService.createAttendance(dto);
  }

  @Get('attendance')
  findAllAttendance(@Query() query: HrAttendanceQueryDto) {
    return this.hrService.findAllAttendance(query);
  }

  @Get('attendance/:id')
  findAttendanceById(@Param('id') id: string) {
    return this.hrService.findAttendanceById(id);
  }

  @Patch('attendance/:id')
  updateAttendance(@Param('id') id: string, @Body() dto: UpdateHrAttendanceDto) {
    return this.hrService.updateAttendance(id, dto);
  }

  @Delete('attendance/:id')
  deleteAttendance(@Param('id') id: string) {
    return this.hrService.deleteAttendance(id);
  }

  // ─── Payroll ──────────────────────────────────────────

  @Post('payroll')
  createPayroll(@Body() dto: CreateHrPayrollDto) {
    return this.hrService.createPayroll(dto);
  }

  @Get('payroll')
  findAllPayroll(@Query() query: HrPayrollQueryDto) {
    return this.hrService.findAllPayroll(query);
  }

  @Get('payroll/:id')
  findPayrollById(@Param('id') id: string) {
    return this.hrService.findPayrollById(id);
  }

  @Patch('payroll/:id')
  updatePayroll(@Param('id') id: string, @Body() dto: UpdateHrPayrollDto) {
    return this.hrService.updatePayroll(id, dto);
  }

  @Delete('payroll/:id')
  deletePayroll(@Param('id') id: string) {
    return this.hrService.deletePayroll(id);
  }

  // ─── Announcements ──────────────────────────────────────────

  @Post('announcements')
  createAnnouncement(@Body() dto: CreateHrAnnouncementDto) {
    return this.hrService.createAnnouncement(dto);
  }

  @Get('announcements')
  findAllAnnouncements(@Query() query: HrAnnouncementQueryDto) {
    return this.hrService.findAllAnnouncements(query);
  }

  @Get('announcements/:id')
  findAnnouncementById(@Param('id') id: string) {
    return this.hrService.findAnnouncementById(id);
  }

  @Patch('announcements/:id')
  updateAnnouncement(@Param('id') id: string, @Body() dto: UpdateHrAnnouncementDto) {
    return this.hrService.updateAnnouncement(id, dto);
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@Param('id') id: string) {
    return this.hrService.deleteAnnouncement(id);
  }

  // ─── Documents ──────────────────────────────────────────

  @Post('documents')
  createDocument(@Body() dto: CreateHrDocumentDto) {
    return this.hrService.createDocument(dto);
  }

  @Get('documents')
  findAllDocuments(@Query() query: HrDocumentQueryDto) {
    return this.hrService.findAllDocuments(query);
  }

  @Get('documents/:id')
  findDocumentById(@Param('id') id: string) {
    return this.hrService.findDocumentById(id);
  }

  @Patch('documents/:id')
  updateDocument(@Param('id') id: string, @Body() dto: UpdateHrDocumentDto) {
    return this.hrService.updateDocument(id, dto);
  }

  @Delete('documents/:id')
  deleteDocument(@Param('id') id: string) {
    return this.hrService.deleteDocument(id);
  }
}
