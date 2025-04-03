import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ChromaModule } from '../chroma/chroma.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [ChromaModule, OpenAIModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {} 