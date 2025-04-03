import { Injectable } from '@nestjs/common';
import { Express } from 'express';
import { ChromaService } from '../chroma/chroma.service';
import { OpenAIService } from '../openai/openai.service';
import * as fs from 'fs/promises';

@Injectable()
export class FilesService {
  private readonly allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
  ];

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
    // Get relevant documents from ChromaDB
    const searchResults = await this.chromaService.searchFiles(query);
    
    // Extract documents from search results
    const documents = searchResults.documents[0] || [];
    const metadatas = searchResults.metadatas[0] || [];

    // Generate AI response using OpenAI
    const aiResponse = await this.openAIService.generateResponse(query, documents);

    return {
      query,
      relevantDocuments: documents.map((doc, index) => ({
        content: doc,
        metadata: metadatas[index]
      })),
      aiResponse
    };
  }
} 