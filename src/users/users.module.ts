import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Make PrismaService available in this module
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}