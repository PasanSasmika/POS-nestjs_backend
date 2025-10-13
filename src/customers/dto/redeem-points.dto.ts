import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class RedeemPointsDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive() // Must redeem at least 1 point
  points: number;
}