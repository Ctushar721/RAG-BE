import { Controller, Post, UploadedFiles, UseInterceptors, Get, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files at once
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.filesService.uploadFiles(files);
  }

  @Get('search')
  async searchFiles(@Query('query') query: string) {
    return this.filesService.searchFiles(query);
  }
} 