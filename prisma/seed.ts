// --- FIX 1: Import 'Vendor' type ---
import { PrismaClient, Product, User, Customer, Vendor } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Helper function to create a fake sale with specific products.
 */
async function createFakeSale(
  productsInCart: (Product | undefined)[],
  users: User[],
  customers: Customer[],
  storeId: number,
  index: number
) {
  // --- FIX 2: Explicitly type the 'saleItems' array ---
  const saleItems: {
    productId: number;
    quantity: number;
    price: number;
    costPrice: number;
    profit: number;
  }[] = [];
  
  let costTotal = 0;
  let totalAmount = 0;

  for (const product of productsInCart) {
    if (!product) continue;
    
    const quantity = faker.number.int({ min: 1, max: 2 });
    const itemCost = product.costPrice * quantity;
    const itemTotal = product.sellingPrice * quantity;
    costTotal += itemCost;
    totalAmount += itemTotal;

    saleItems.push({
      productId: product.id,
      quantity: quantity,
      price: product.sellingPrice,
      costPrice: product.costPrice,
      profit: itemTotal - itemCost,
    });
  }

  // Don't create sales with no items
  if (saleItems.length === 0) return;

  // Create the Sale record and link the SaleItems
  await prisma.sale.create({
    data: {
      invoiceNumber: `INV-${Date.now()}-${index}`,
      userId: faker.helpers.arrayElement(users).id,
      storeId: storeId,
      customerId: faker.helpers.arrayElement(customers).id,
      totalAmount: totalAmount,
      costTotal: costTotal,
      profitTotal: totalAmount - costTotal,
      paymentMethod: faker.helpers.arrayElement(['Cash', 'Card']),
      status: 'Completed',
      items: {
        create: saleItems, // This will now work correctly
      },
    },
  });
}


/**
 * Main seeding function
 */
async function main() {
  console.log('Start seeding database...');
  console.log('Clearing existing data...');

  // --- Clear Existing Data ---
  await prisma.saleItem.deleteMany();
  await prisma.stockInLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.customerDocument.deleteMany();
  await prisma.vendorDocument.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  console.log('Creating new data...');

  // --- 1. Create Stores ---
  const store1 = await prisma.store.create({
    data: { name: 'Main Branch', address: '123 Main St' },
  });

  // --- 2. Create Users ---
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      fullName: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      storeId: store1.id,
    },
  });
  const cashierUser = await prisma.user.create({
    data: {
      username: 'cashier',
      fullName: 'Cashier User',
      password: hashedPassword,
      role: 'CASHIER',
      storeId: store1.id,
    },
  });
  // This array is fine, as TypeScript can infer the type from the initial values
  const users = [adminUser, cashierUser]; 

  // --- 3. Create Vendors ---
  // --- FIX 3: Explicitly type the 'vendors' array ---
  const vendors: Vendor[] = [];
  for (let i = 0; i < 10; i++) {
    const vendor = await prisma.vendor.create({
      data: {
        name: faker.company.name(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
    });
    vendors.push(vendor); // This will now work
  }

  // --- 4. Create Products ---
  // --- FIX 4: Explicitly type the 'products' array ---
  const products: Product[] = [];
  
  // Manually create the products we need for our AI patterns
  const product8 = await prisma.product.create({
    data: {
      id: 8,
      sku: '1124',
      name: 'Headset',
      category: 'electronic',
      costPrice: 1700,
      sellingPrice: 2100,
      stockQuantity: 100,
      reorderLevel: 10,
      supplierId: faker.helpers.arrayElement(vendors).id, // This will now work
    },
  });
  products.push(product8);

  const product9 = await prisma.product.create({
    data: {
      id: 9,
      sku: 'R-1233',
      name: 'Router',
      category: 'electric',
      costPrice: 5000,
      sellingPrice: 7500,
      stockQuantity: 100,
      reorderLevel: 10,
      supplierId: faker.helpers.arrayElement(vendors).id,
    },
  });
  products.push(product9);

  const product5 = await prisma.product.create({
    data: {
      id: 5,
      sku: 'LR222',
      name: 'Google Pixel 7',
      category: 'Mobile',
      costPrice: 120000,
      sellingPrice: 175000,
      stockQuantity: 100,
      reorderLevel: 10,
      supplierId: faker.helpers.arrayElement(vendors).id,
    },
  });
  products.push(product5);

  // Create 47 more random products
  for (let i = 0; i < 47; i++) {
    const product = await prisma.product.create({
      data: {
        sku: faker.string.alphanumeric(10).toUpperCase(),
        name: faker.commerce.productName(),
        category: faker.commerce.department(),
        costPrice: parseFloat(faker.commerce.price({ min: 50, max: 500 })),
        sellingPrice: parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
        stockQuantity: 100,
        reorderLevel: 10,
        supplierId: faker.helpers.arrayElement(vendors).id,
      },
    });
    products.push(product);
  }

  // --- 5. Create Customers ---
  // --- FIX 5: Explicitly type the 'customers' array ---
  const customers: Customer[] = [];
  for (let i = 0; i < 100; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      },
    });
    customers.push(customer);
  }

  // --- 6. Create Sales with Patterns ---
  
  // Create 30 sales with the Headset + Router pattern
  console.log('Creating Headset + Router pattern...');
  for (let i = 0; i < 30; i++) {
    await createFakeSale([product8, product9], users, customers, store1.id, i);
  }
  
  // Create 30 sales with the Google Pixel + Headset pattern
  console.log('Creating Pixel + Headset pattern...');
  for (let i = 0; i < 30; i++) {
    await createFakeSale([product5, product8], users, customers, store1.id, i + 30);
  }

  // Create 400+ more random sales
  console.log('Creating random sales...');
  for (let i = 0; i < 400; i++) {
    const itemsInCart = faker.number.int({ min: 1, max: 4 });
    const shuffledProducts = faker.helpers.shuffle(products);
    const cartProducts = shuffledProducts.slice(0, itemsInCart);
    await createFakeSale(cartProducts, users, customers, store1.id, i + 100);
  }

  console.log('Database seeding finished successfully.');
}

// --- Run the main function ---
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma Client connection
    await prisma.$disconnect();
  });