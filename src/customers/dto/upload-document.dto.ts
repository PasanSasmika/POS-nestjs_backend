import { IsEnum, IsNotEmpty } from 'class-validator';
import { CustomerDocCategory } from '@prisma/client';

export class UploadDocumentDto {
  @IsEnum(CustomerDocCategory)
  @IsNotEmpty()
  category: CustomerDocCategory;
}