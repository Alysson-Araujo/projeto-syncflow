import { Controller, Get, Logger, NotFoundException, Param } from '@nestjs/common';
import { ProcessingServiceService } from './processing-service.service';

@Controller()
export class ProcessingServiceController {
  private readonly logger = new Logger (ProcessingServiceController.name);
  
    constructor(private readonly processingService: ProcessingServiceService,
  ) {}

  @Get()
  healthCheck() {
    return {
      service: 'processing-service',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  getStats() {
    return this.processingService.getStats();
  }

  @Get('files/:id')
  async getFile(@Param('id') fileId: string) {
    this.logger.log(`📨 GET /files/${fileId}`);
    
    const file = await this.processingService.getFile(fileId);

    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    return {
      id: file.id,
      name: file.name,
      status: file.status,
      hash: file.hash,
      size: file.sizeInBytes,
      mimeType: file.mimeType,
      metadata: file.metadata,
      createdAt: file.createdAt,
      processedAt: file.processedAt,
    };
  }
}