import { Controller, Post, UploadedFiles, UseInterceptors, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { SearchQueryDto } from './dto/search.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files at once
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.filesService.uploadFiles(files);
  }

  @Post('search')
  async searchFiles(@Body() searchQuery: SearchQueryDto) {
    return this.filesService.searchFiles(searchQuery.query);
  }
} 