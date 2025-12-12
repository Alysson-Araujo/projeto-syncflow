import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUploadDto } from './dtos/get-presigned-url.dto';
import { UploadService } from './upload-service.service';

@Controller()
export class UploadServiceController {
  constructor(private readonly storageService: UploadService 
  ) {}

  @Get()
  getHello(): string {
    return 'Upload Service is running';
  }

  @Post('upload')
  async getPresignedUrl(@Body() body: CreateUploadDto) {
    const bucket = 'syncflow';
    const key = 'testes/';
    
    const url = await this.storageService.createUpload(body);
    return { url };
  }

  @Post('upload/:id/complete')
  async completeUpload(@Param('id') id: string) {
    return await this.storageService.completeUpload(id);
  }
}
