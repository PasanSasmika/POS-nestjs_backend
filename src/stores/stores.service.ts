import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  // Create a new store
  create(createStoreDto: CreateStoreDto) {
    return this.prisma.store.create({
      data: createStoreDto,
    });
  }

  // Find all stores (simplified for dropdowns)
  findAllForDropdown() {
    return this.prisma.store.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Find all stores (full details for management)
  findAll() {
    return this.prisma.store.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }


  // Find a single store by ID
  async findOne(id: number) {
    const store = await this.prisma.store.findUnique({
      where: { id },
    });
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found.`);
    }
    return store;
  }

  // Update a store by ID
  async update(id: number, updateStoreDto: UpdateStoreDto) {
    await this.findOne(id); 
    return this.prisma.store.update({
      where: { id },
      data: updateStoreDto,
    });
  }

  // Remove (delete) a store by ID
  async remove(id: number) {
    await this.findOne(id); 
    try {
        return await this.prisma.store.delete({
            where: { id },
        });
    } catch (error: any) {
        // Handle potential foreign key constraint errors
        if (error.code === 'P2003' || error.code === 'P2014') { 
            throw new NotFoundException(`Cannot delete store with ID ${id}: It is currently linked to users or sales.`);
        }
        throw error; // Re-throw other errors
    }
  }
}