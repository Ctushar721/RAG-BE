import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChromaClient } from 'chromadb';
import { Express } from 'express';

@Injectable()
export class ChromaService implements OnModuleInit {
  private client: ChromaClient;
  private collection: any;

  constructor() {
    this.client = new ChromaClient({
      path: 'http://localhost:8000'
    });
  }

  async onModuleInit() {
    // Create or get the collection for files
    this.collection = await this.client.getOrCreateCollection({
      name: 'files',
      metadata: { description: 'Collection for uploaded files' }
    });
  }

  async addFile(file: Express.Multer.File, content: string) {
    const id = `${file.originalname}-${Date.now()}`;
    
    await this.collection.add({
      ids: [id],
      documents: [content],
      metadatas: [{
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: new Date().toISOString()
      }]
    });

    return {
      id,
      message: 'File added to ChromaDB successfully'
    };
  }

  async searchFiles(query: string, limit: number = 5) {
    const results = await this.collection.query({
      queryTexts: [query],
      nResults: limit
    });

    return results;
  }
} 