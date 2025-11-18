import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing transactional data...');

  // Delete in reverse order to respect foreign key constraints
  await prisma.saleItem.deleteMany();
  await prisma.stockInLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.customerDocument.deleteMany();
  await prisma.vendorDocument.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();
  
  console.log('Transactional data cleared.');
  console.log('Users and Stores were NOT deleted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });