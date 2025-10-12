import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, ValidateNested } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

// This DTO represents a single item in the cart
class CartItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsPositive() // Quantity must be at least 1
  quantity: number;
}

// This is the main DTO for creating a sale
export class CreateSaleDto {
  @IsNumber()
  @IsOptional()
  customerId?: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}