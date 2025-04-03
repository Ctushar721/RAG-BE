import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async generateResponse(query: string, context: string[]) {
    try {
      // Limit context length to save tokens
      const limitedContext = context.slice(0, 1); // Only use first document to save tokens
      const prompt = `You are a helpful assistant that answers questions based ONLY on the provided context. Follow these rules strictly:

1. Use ONLY the information provided in the context below to answer the question
2. If the answer cannot be found in the context, respond with "I cannot answer this question based on the provided context."
3. Do not use any external knowledge or make assumptions beyond what is given in the context
4. If the context is incomplete or unclear, acknowledge this in your response

Context:
${limitedContext.join('\n')}

Question: ${query}

Answer:`;

      const completion = await this.openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt: prompt,
        max_tokens: 100, // Further reduced token limit
        temperature: 0.2, // Even lower temperature for more focused responses
        top_p: 0.05, // More conservative sampling
      });

      return completion.choices[0].text.trim();
    } catch (error) {
      this.logger.error(`OpenAI API Error: ${error.message}`);
      
      // If quota exceeded, return a fallback response
      if (error.message.includes('quota')) {
        return `Here's the relevant information from the context:

${context.slice(0, 1).join('\n')}

Note: This is a basic response due to service limitations.`;
      }

      // For other errors, return a generic error message
      return 'Unable to process request at this time. Please try again later.';
    }
  }
} 