import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface LogActionParams {
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  details?: object;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction({ userId, action, entity, entityId, details }: LogActionParams) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details || {},
      },
    });
  }
}