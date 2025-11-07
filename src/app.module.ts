import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { VendorsModule } from './vendors/vendors.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { CustomersModule } from './customers/customers.module';
import { FilesModule } from './files/files.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { StoresModule } from './stores/stores.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
    }),
    UsersModule, PrismaModule, AuthModule, VendorsModule, ProductsModule, SalesModule, CustomersModule, FilesModule, ReportsModule, AuditModule, StoresModule, AiModule], // Add UsersModule and PrismaModule here
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}