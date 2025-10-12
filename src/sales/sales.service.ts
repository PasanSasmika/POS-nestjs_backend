import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  // src/sales/sales.service.ts

  async create(createSaleDto: CreateSaleDto, userId: number, storeId: number) {
    const { customerId, items } = createSaleDto;

    return this.prisma.$transaction(async (tx) => {
      const productIds = items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const saleItemsData: any[] = [];
      let costTotal = 0;
      let totalAmount = 0;

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found.`);
        }
        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
        }
        
        costTotal += product.costPrice * item.quantity;
        totalAmount += product.sellingPrice * item.quantity;
        
        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.sellingPrice,
          costPrice: product.costPrice,
          profit: (product.sellingPrice - product.costPrice) * item.quantity,
        });
      }
      
      const profitTotal = totalAmount - costTotal;

      const sale = await tx.sale.create({
        data: {
          invoiceNumber: `INV-${Date.now()}`,
          totalAmount,
          costTotal,
          profitTotal,
          paymentMethod: createSaleDto.paymentMethod,
          userId,
          storeId,
          customerId,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return sale;
    });
  }

  // ... findAll and findOne methods remain the same
  findAll() {
    return this.prisma.sale.findMany({
      include: { user: { select: { fullName: true } }, customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
        user: true,
        customer: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found.`);
    }
    return sale;
  }
}