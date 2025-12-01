import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const resetTestDb = async () => {
  
  await prisma.saleItem.deleteMany();
  await prisma.stockInLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.customerDocument.deleteMany();
  await prisma.vendorDocument.deleteMany();
  
  await prisma.sale.deleteMany();
  
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();
};