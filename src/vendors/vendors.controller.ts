import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadDocumentDto } from './dto/upload-document.dto';
import type { Request } from 'express';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes in this controller
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER) // Only Admin and Manager can create vendors
  create(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorsService.create(createVendorDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER) // Only Admin and Manager can view vendors
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateVendorDto: UpdateVendorDto) {
    return this.vendorsService.update(id, updateVendorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Only Admin can delete vendors
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.remove(id);
  }

  @Post(':id/documents')
  @Roles(Role.ADMIN, Role.MANAGER)
  @UseInterceptors(FileInterceptor('file')) // 'file' is the field name in the form-data
  uploadDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() documentDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number };
    return this.vendorsService.addDocument(id, documentDto, file, user.id);
  }

}