import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, ValidateNested } from 'class-validator';

class ReceiveStockItemDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @IsPositive()
  quantityReceived: number;

  @IsNumber()
  @IsPositive()
  costPrice: number;
}

export class ReceiveStockDto {
  @IsInt()
  @IsOptional() // Vendor might be "other" or "unknown"
  vendorId?: number;
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveStockItemDto)
  items: ReceiveStockItemDto[];
}