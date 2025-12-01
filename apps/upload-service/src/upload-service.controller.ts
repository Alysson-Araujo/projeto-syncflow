import { Body, Controller, Get, Post } from '@nestjs/common';
import { StorageService } from './storage/storage.service';
import { CreateUploadDto } from './dtos/get-presigned-url.dto';

@Controller()
export class UploadServiceController {
  constructor(private readonly storageService: StorageService 
  ) {}

  @Get()
  getHello(): string {
    return 'Upload Service is running';
  }

  @Post('upload')
  async getPresignedUrl(@Body() body: CreateUploadDto) {
    const bucket = 'syncflow';
    const key = 'testes/';
    
    const url = await this.storageService.getPresignedUploadUrl(bucket, key);
    return { url };
  }
}
