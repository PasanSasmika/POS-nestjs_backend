import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/guards/roles.decorator';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles(Role.ADMIN) 
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  @Roles(Role.ADMIN) 
  findAll() {
    return this.storesService.findAll();
  }

  @Get('dropdown')
  @Roles(Role.ADMIN, Role.MANAGER) 
  findAllForDropdown() {
    return this.storesService.findAllForDropdown();
  }

  @Get(':id')
  @Roles(Role.ADMIN) 
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) 
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) 
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.remove(id);
  }
}