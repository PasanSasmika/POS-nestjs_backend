import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule], 
  controllers: [VendorsController],
  providers: [VendorsService]
})
export class VendorsModule {}
