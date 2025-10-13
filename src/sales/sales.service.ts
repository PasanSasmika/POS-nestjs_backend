import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AuditService } from 'src/audit/audit.service';
@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService,
     private auditService: AuditService,
  ) {}

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

      if (customerId) {
        const pointsEarned = Math.floor(totalAmount / 100);
        if (pointsEarned > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              loyaltyPoints: {
                increment: pointsEarned,
              },
            },
          });
        }
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

  async refund(saleId: number , userId: number) {
    // Use a transaction to ensure both stock and sale status are updated together
    return this.prisma.$transaction(async (tx) => {
      // 1. Find the original sale and its items
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      // 2. Validate the sale
      if (!sale) {
        throw new NotFoundException(`Sale with ID ${saleId} not found.`);
      }
      if (sale.status === 'Refunded') {
        throw new ConflictException(`Sale with ID ${saleId} has already been refunded.`);
      }

      // 3. Add the stock back to inventory for each item in the sale
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity, // Use 'increment' to add stock back
            },
          },
        });
      }

      // 4. Update the sale's status to 'Refunded'
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'Refunded',
        },
      });

       await this.auditService.logAction({
        userId: userId,
        action: 'REFUND_SALE',
        entity: 'Sale',
        entityId: sale.id,
        details: { originalStatus: 'Completed', newStatus: 'Refunded' }
      });

      return updatedSale;
    });
  }
}