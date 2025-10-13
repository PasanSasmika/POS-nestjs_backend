import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesSummary(startDate?: string, endDate?: string) {
    // Define the date range for the query
    const dateFilter = {
      gte: startDate ? new Date(startDate) : undefined, // Greater than or equal to
      lte: endDate ? new Date(endDate) : undefined,   // Less than or equal to
    };

    // Use Prisma's aggregate function to calculate everything at once
    const summary = await this.prisma.sale.aggregate({
      where: {
        createdAt: dateFilter,
        status: 'Completed', // Only include completed sales
      },
      _sum: {
        totalAmount: true, // Sum of all sales amounts (Revenue)
        profitTotal: true, // Sum of all profits
      },
      _count: {
        id: true, // Count of all sales
      },
      _avg: {
        totalAmount: true, // Average sale amount
      },
    });

    // Format the response into a cleaner object
    return {
      totalRevenue: summary._sum.totalAmount ?? 0,
      totalProfit: summary._sum.profitTotal ?? 0,
      numberOfSales: summary._count.id ?? 0,
      averageSaleValue: summary._avg.totalAmount ?? 0,
      period: {
        from: startDate,
        to: endDate,
      },
    };
  }

  

  async getStockSummary() {
    // 1. Fetch all products once. This is the only database call needed.
    const allProducts = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
    });

    // 2. Calculate the total inventory value
    const totalInventoryValue = allProducts.reduce((sum, product) => {
      return sum + (product.stockQuantity * product.costPrice);
    }, 0);

    // 3. Filter the already-fetched list in memory to find low-stock items.
    //    This is efficient and fixes the error.
    const lowStockItems = allProducts
      .filter(product => product.stockQuantity <= product.reorderLevel)
      .map(product => ({
        // Format the object to match the desired output
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel,
      }));

    // 4. Combine everything into the response object
    return {
      totalProducts: allProducts.length,
      totalInventoryValue,
      lowStockItemsCount: lowStockItems.length,
      lowStockItems,
      allProducts, //  can choose to return the full list or not
    };
  }

}