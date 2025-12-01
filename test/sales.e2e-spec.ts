import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { resetTestDb } from './utils/db-reset';
import { PrismaService } from './../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { PaymentMethod, Role } from '@prisma/client';

describe('Sales Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let cashierUserId: number;
  let productId: number;
  let storeId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await resetTestDb();
    await seedData();
    authToken = await loginAndGetToken();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const seedData = async () => {
    const store = await prisma.store.create({ data: { name: 'Test Store' } });
    storeId = store.id;

    const vendor = await prisma.vendor.create({ data: { name: 'Test Vendor', phone: '123' } });

    const product = await prisma.product.create({
      data: {
        sku: 'TEST-SKU',
        name: 'Test Product',
        category: 'General',
        costPrice: 50,
        sellingPrice: 100,
        stockQuantity: 10,
        supplierId: vendor.id,
      },
    });
    productId = product.id;

    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'cashier',
        password: hashedPassword,
        fullName: 'Test Cashier',
        role: Role.CASHIER,
        storeId: store.id,
      },
    });
    cashierUserId = user.id;
  };

  const loginAndGetToken = async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'cashier', password: 'password123' });
    return res.body.access_token;
  };


  it('/sales (POST) - Should create sale and decrement stock', async () => {
    const saleData = {
      paymentMethod: PaymentMethod.Cash,
      items: [{ productId: productId, quantity: 2 }],
    };

    const response = await request(app.getHttpServer())
      .post('/sales')
      .set('Authorization', `Bearer ${authToken}`) 
      .send(saleData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.totalAmount).toBe(200); 
    expect(response.body.items).toHaveLength(1);

    const updatedProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(updatedProduct?.stockQuantity).toBe(8); 
  });

  it('/sales (POST) - Should fail if stock is insufficient', async () => {
    const saleData = {
      paymentMethod: PaymentMethod.Card,
      items: [{ productId: productId, quantity: 20 }], 
    };

    await request(app.getHttpServer())
      .post('/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send(saleData)
      .expect(400); 
  });

  it('/sales (POST) - Should fail if product does not exist', async () => {
    const saleData = {
      paymentMethod: PaymentMethod.Cash,
      items: [{ productId: 99999, quantity: 1 }], 
    };

    await request(app.getHttpServer())
      .post('/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send(saleData)
      .expect(404); 
  });
});