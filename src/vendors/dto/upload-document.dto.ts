import { IsEnum, IsNotEmpty } from 'class-validator';
import { VendorDocCategory } from '@prisma/client';

export class UploadDocumentDto {
  @IsEnum(VendorDocCategory)
  @IsNotEmpty()
  category: VendorDocCategory;
}