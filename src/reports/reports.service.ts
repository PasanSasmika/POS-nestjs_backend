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
}