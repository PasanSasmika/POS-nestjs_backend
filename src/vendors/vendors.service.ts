import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  create(createVendorDto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: createVendorDto });
  }

  findAll() {
    return this.prisma.vendor.findMany();
  }

  async findOne(id: number) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return vendor;
  }

  async update(id: number, updateVendorDto: UpdateVendorDto) {
    await this.findOne(id); // Ensure the vendor exists before updating
    return this.prisma.vendor.update({
      where: { id },
      data: updateVendorDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure the vendor exists before deleting
    return this.prisma.vendor.delete({ where: { id } });
  }
}