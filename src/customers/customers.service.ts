import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Check for duplicate phone number
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { phone: createCustomerDto.phone },
    });

    if (existingCustomer) {
      throw new ConflictException(`Customer with phone number ${createCustomerDto.phone} already exists.`);
    }

    return this.prisma.customer.create({ data: createCustomerDto });
  }

  findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({ 
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Include the 10 most recent sales
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id); // Ensure customer exists
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure customer exists
    return this.prisma.customer.delete({ where: { id } });
  }

  async addDocument(
    customerId: number,
    documentDto: UploadDocumentDto,
    file: Express.Multer.File,
    userId: number,
  ) {
    await this.findOne(customerId); // Ensure customer exists

    return this.prisma.customerDocument.create({
      data: {
        customerId,
        uploadedById: userId,
        category: documentDto.category,
        fileName: file.originalname,
        filePath: file.path,
      },
    });
  }
}