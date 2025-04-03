import { Injectable, Logger } from '@nestjs/common';
import { Express } from 'express';
import { ChromaService } from '../chroma/chroma.service';
import { OpenAIService } from '../openai/openai.service';
import * as fs from 'fs/promises';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
  ];
  private readonly RELEVANCE_THRESHOLD = 1.5;
  private readonly MAX_RESULTS = 3;

  constructor(
    private readonly chromaService: ChromaService,
    private readonly openAIService: OpenAIService,
  ) {}

  async uploadFiles(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    const results = await Promise.all(
      files.map(async (file) => {
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
          return {
            filename: file.originalname,
            success: false,
            error: 'Invalid file type. Only PDF, TXT, CSV, and JSON files are allowed.'
          };
        }

        try {
          // Read file content as string
          let content = '';
          if (file.mimetype === 'text/plain' || file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
            content = file.buffer.toString('utf-8');
          } else if (file.mimetype === 'application/pdf') {
            // For PDF files, we'll just store metadata for now
            // You might want to add PDF text extraction here
            content = `PDF File: ${file.originalname}`;
          }

          // Store in ChromaDB
          const result = await this.chromaService.addFile(file, content);

          return {
            filename: file.originalname,
            success: true,
            message: 'File uploaded and stored in ChromaDB successfully',
            mimetype: file.mimetype,
            size: file.size,
            chromaId: result.id
          };
        } catch (error) {
          return {
            filename: file.originalname,
            success: false,
            error: error.message
          };
        }
      })
    );

    return {
      totalFiles: files.length,
      successfulUploads: results.filter(r => r.success).length,
      failedUploads: results.filter(r => !r.success).length,
      results
    };
  }

  async searchFiles(query: string) {
    try {
      // Input validation
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Invalid search query: Query must be a non-empty string');
      }

      // Get relevant documents from ChromaDB
      let searchResults;
      try {
        searchResults = await this.chromaService.searchFiles(query);
      } catch (error) {
        this.logger.error(`ChromaDB search failed: ${error.message}`, error.stack);
        throw new Error(`Failed to search documents: ${error.message}`);
      }

      // Validate search results structure
      if (!searchResults || !searchResults.documents || !searchResults.metadatas || !searchResults.distances) {
        throw new Error('Invalid search results structure received from ChromaDB');
      }
      
      // Extract documents and distances from search results
      const documents = searchResults.documents[0] || [];
      const metadatas = searchResults.metadatas[0] || [];
      const distances = searchResults.distances[0] || [];

      // Log search results for debugging
      this.logger.debug(`Search results for query: ${query}`);
      this.logger.debug(`Total documents found: ${documents.length}`);
      this.logger.debug(`Distances: ${distances.join(', ')}`);

      // Filter documents by relevance threshold and get top 3
      const relevantResults = documents
        .map((doc, index) => ({
          content: doc,
          metadata: metadatas[index],
          distance: distances[index]
        }))
        .filter(result => {
          const isRelevant = result.distance <= this.RELEVANCE_THRESHOLD;
          this.logger.debug(`Document distance: ${result.distance}, Is relevant: ${isRelevant}`);
          return isRelevant;
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, this.MAX_RESULTS);

      this.logger.debug(`Relevant documents after filtering: ${relevantResults.length}`);

      // Generate AI response using OpenAI with filtered documents
      let aiResponse;
      try {
        aiResponse = await this.openAIService.generateResponse(
          query, 
          relevantResults.map(result => result.content)
        );
      } catch (error) {
        this.logger.error(`OpenAI response generation failed: ${error.message}`, error.stack);
        throw new Error(`Failed to generate AI response: ${error.message}`);
      }

      return {
        query,
        relevantDocuments: relevantResults.map(result => ({
          content: result.content,
          metadata: result.metadata,
          relevance: 1 / (1 + result.distance) // Convert distance to relevance score (0 to 1)
        })),
        aiResponse,
        searchStats: {
          totalDocuments: documents.length,
          documentsAboveThreshold: relevantResults.length,
          threshold: this.RELEVANCE_THRESHOLD,
          distances: distances,
          minDistance: Math.min(...distances),
          maxDistance: Math.max(...distances)
        }
      };
    } catch (error) {
      this.logger.error(`Search operation failed: ${error.message}`, error.stack);
      throw error; // Re-throw the error to be handled by the controller
    }
  }
} 