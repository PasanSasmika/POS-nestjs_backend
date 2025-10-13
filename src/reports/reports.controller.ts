import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/guards/roles.decorator';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-summary')
  @Roles(Role.ADMIN, Role.MANAGER) // Only Admin and Manager can view reports
  getSalesSummary(@Query() queryDto: ReportQueryDto) {
    return this.reportsService.getSalesSummary(queryDto.startDate, queryDto.endDate);
  }
}