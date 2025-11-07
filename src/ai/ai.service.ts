import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.getOrThrow<string>('GOOGLE_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async getRecommendations(cartItemIds: number[], customerId: number | null) {
    this.logger.log(`Fetching recommendations for cart: [${cartItemIds.join(', ')}]`);
    
    try {
      // 1. Get Customer History (if available)
      let customerHistory = 'No customer history provided.';
      if (customerId) {
        const pastPurchases = await this.prisma.saleItem.findMany({
          where: { sale: { customerId: customerId } },
          select: { product: { select: { name: true } } },
          take: 10,
          distinct: ['productId'],
        });
        if (pastPurchases.length > 0) {
          customerHistory = `This customer has previously bought: ${pastPurchases.map(p => p.product.name).join(', ')}.`;
        }
      }

      // 2. Get Current Cart Details
      const cartProducts = await this.prisma.product.findMany({
        where: { id: { in: cartItemIds } },
        select: { name: true, category: true },
      });
      const cartDetails = `The customer's current cart contains: ${cartProducts.map(p => `${p.name} (${p.category})`).join(', ')}.`;

      // 3. Find "Frequently Bought Together" items
      const salesWithCartItems = await this.prisma.sale.findMany({
        where: { items: { some: { productId: { in: cartItemIds } } } },
        include: { items: { include: { product: { select: { id: true, name: true } } } } },
        take: 50,
      });

      const coPurchaseCounter: Record<string, number> = {};
      for (const sale of salesWithCartItems) {
        for (const item of sale.items) {
          if (!cartItemIds.includes(item.productId)) {
            coPurchaseCounter[item.product.name] = (coPurchaseCounter[item.product.name] || 0) + 1;
          }
        }
      }
      
      const topCommonItems = Object.entries(coPurchaseCounter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);

      if (topCommonItems.length === 0) {
        this.logger.log('No common items found. No recommendation.');
        return { recommendation: null, reason: null };
      }
      
      const commonItemsList = `Commonly co-purchased items: ${topCommonItems.join(', ')}.`;

      // 4. Build the AI Prompt
      const prompt = `
        You are an expert POS sales assistant. Your goal is to provide one single, high-value upsell or cross-sell recommendation.
        RULES:
        1.  Analyze the context, history, and patterns.
        2.  DO NOT recommend an item already in the customer's cart.
        3.  DO NOT recommend an item from the customer's purchase history.
        4.  Provide a short, convincing reason for your recommendation.
        5.  Return ONLY a JSON object in the format: { "productName": "string", "reason": "string" }
        6.  If no logical recommendation exists (e.g., all common items are in history or cart), return { "productName": null, "reason": null }.

        CONTEXT:
        - ${cartDetails}
        - ${customerHistory}
        - ${commonItemsList}

        Based on this, what is your single best recommendation?
      `;

      // 5. Call the Gemini API
      this.logger.log('Calling Gemini API...');
const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResponse = JSON.parse(jsonText);
      this.logger.log('AI Response:', aiResponse);

      return aiResponse;

    } catch (error) {
      this.logger.error('AI Service Error:', error);
      throw new Error('Failed to get AI recommendation.');
    }
  }
}