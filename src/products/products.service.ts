import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ReceiveStockDto } from './dto/receive-stock.dto';

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

  async receiveStock(receiveStockDto: ReceiveStockDto, userId: number) {
  const { vendorId, items } = receiveStockDto;

  // Use a transaction to ensure all updates succeed or fail together
  return this.prisma.$transaction(async (tx) => {
    
    // Loop through each item in the received shipment
    for (const item of items) {
      
      // 1. Increment the stock quantity
      // 2. Update the product's main costPrice to this new cost
      const updatedProduct = await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantityReceived, // Adds to the current quantity
          },
          costPrice: item.costPrice, // Updates the main cost price
        },
      });

      // 3. Create a log entry for this transaction
      await tx.stockInLog.create({
        data: {
          productId: item.productId,
          vendorId: vendorId,
          userId: userId,
          quantityReceived: item.quantityReceived,
          costPrice: item.costPrice,
        },
      });
    }
    
    return { message: "Stock received successfully." };
  });
}

async getStockInLogs() {
  return this.prisma.stockInLog.findMany({
    orderBy: {
      createdAt: 'desc', // Show newest first
    },
    include: {
      // Join related data to get the names
      product: {
        select: { name: true, sku: true },
      },
      user: {
        select: { fullName: true, username: true },
      },
      vendor: {
        select: { name: true },
      },
    },
  });
}
  
}