import { Controller, Get } from '@nestjs/common';
import { ProcessingServiceService } from './processing-service.service';

@Controller()
export class ProcessingServiceController {
  constructor(private readonly processingServiceService: ProcessingServiceService) {}

  @Get()
  getHello(): string {
    return this.processingServiceService.getHello();
  }
}
