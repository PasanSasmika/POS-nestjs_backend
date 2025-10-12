import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Check if the supplier exists
    const supplier = await this.prisma.vendor.findUnique({
      where: { id: createProductDto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${createProductDto.supplierId} not found.`);
    }
    return this.prisma.product.create({ data: createProductDto });
  }

  findAll() {
    // Include supplier information when fetching products
    return this.prisma.product.findMany({
      include: {
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true, // Include all supplier details
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Ensure product exists
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure product exists
    return this.prisma.product.delete({ where: { id } });
  }

  async findOneBySku(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
    });
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }
  
}