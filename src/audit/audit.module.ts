import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditLogsController } from './audit.controller';

@Global() 
@Module({
  imports: [PrismaModule],
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}