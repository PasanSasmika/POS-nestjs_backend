import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/guards/roles.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN) // Only Admins can view the audit trail
  findAll(@Query('userId', new ParseIntPipe({ optional: true })) userId?: number) {
    return this.prisma.auditLog.findMany({
      where: {
        userId: userId, // Filter by userId if provided
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: { username: true, fullName: true }, // Show who performed the action
        },
      },
    });
  }
}