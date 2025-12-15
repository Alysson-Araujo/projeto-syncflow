import { Controller, Get } from '@nestjs/common';
import { ProcessingServiceService } from './processing-service.service';

@Controller()
export class ProcessingServiceController {
  constructor(private readonly service: ProcessingServiceService) {}

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
    return this.service.getStats();
  }
}