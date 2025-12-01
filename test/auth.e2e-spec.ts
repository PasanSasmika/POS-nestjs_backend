// pos-backend/test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { resetTestDb } from './utils/db-reset';
import { PrismaService } from './../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
describe('Auth System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // --- 1. SETUP (Runs once before all tests) ---
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply global validation pipes (so DTO validation works in tests)
    app.useGlobalPipes(new ValidationPipe()); 
    await app.init();

    // Get access to the DB service
    prisma = app.get<PrismaService>(PrismaService);
  });

  // --- 2. CLEANUP (Runs before every single test) ---
  beforeEach(async () => {
    await resetTestDb(); // Wipe the DB clean
  });

  // --- 3. TEARDOWN (Runs once after all tests) ---
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // --- THE TESTS ---
  describe('POST /auth/login', () => {
    
    // Helper to create a user manually in the DB
    const createTestUser = async () => {
      const store = await prisma.store.create({ data: { name: 'Test Store' } });
      const hashedPassword = await bcrypt.hash('password123', 10);
      return prisma.user.create({
        data: {
          username: 'test_user',
          password: hashedPassword,
          fullName: 'Test User',
          role: 'ADMIN',
          storeId: store.id
        },
      });
    };

    it('should reject login if user does not exist', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'ghost', password: 'password123' })
        .expect(401); // Expect Unauthorized error
    });

    it('should reject login if password is wrong', async () => {
      await createTestUser(); // Create the user first

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test_user', password: 'wrongpassword' })
        .expect(401); // Expect Unauthorized
    });

    it('should return access_token upon successful login', async () => {
      await createTestUser(); // Create the user

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test_user', password: 'password123' })
        .expect(201); // Expect Created/Success

      // Verify the response has the token
      expect(response.body).toHaveProperty('access_token');
      // Verify the token is a string
      expect(typeof response.body.access_token).toBe('string');
    });
    
    it('should fail validation if password is missing', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test_user' }) // No password sent
        .expect(400); // Expect Bad Request (from ValidationPipe)
    });
  });
});