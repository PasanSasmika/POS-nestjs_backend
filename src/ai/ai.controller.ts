import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { Role } from '@prisma/client'; // Import Role
import { Roles } from 'src/auth/guards/roles.decorator'; // Import Roles decorator
import { RolesGuard } from 'src/auth/guards/roles.guard'; // Import RolesGuard

// DTO for the incoming request
class RecommendationDto {
  @IsArray()
  @IsNumber({}, { each: true })
  cartItemIds: number[];

  @IsNumber()
  @IsOptional()
  customerId: number | null;
}

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard) // Secure this endpoint
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommendations')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER) // Only allow sales roles
  getRecommendations(@Body() body: RecommendationDto) {
    const { cartItemIds, customerId } = body;
    return this.aiService.getRecommendations(cartItemIds, customerId);
  }
}