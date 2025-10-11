import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { VendorsModule } from './vendors/vendors.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
    }),
    UsersModule, PrismaModule, AuthModule, VendorsModule, ProductsModule], // Add UsersModule and PrismaModule here
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}