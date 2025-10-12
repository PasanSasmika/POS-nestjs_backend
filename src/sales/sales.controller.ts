import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, Req, BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { Role } from '@prisma/client';
import type { Request } from 'express';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  create(@Body() createSaleDto: CreateSaleDto, @Req() req: Request) {
    const user = req.user as { id: number, storeId: number }; 
    if (!user.storeId) {
      throw new BadRequestException('Cannot create sale: The logged-in user is not assigned to a store.');
    }

    const storeId = user.storeId || 1; 
    return this.salesService.create(createSaleDto, user.id, storeId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }
}