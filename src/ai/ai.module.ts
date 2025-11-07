import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaModule } from 'src/prisma/prisma.module'; // <-- IMPORT PRISMA
import { ConfigModule } from '@nestjs/config'; // <-- IMPORT CONFIG

@Module({
  imports: [PrismaModule, ConfigModule], // <-- ADD THIS IMPORTS ARRAY
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}