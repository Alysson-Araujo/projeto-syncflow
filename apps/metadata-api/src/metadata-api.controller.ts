import { Controller, Get } from '@nestjs/common';
import { MetadataApiService } from './metadata-api.service';

@Controller()
export class MetadataApiController {
  constructor(private readonly metadataApiService: MetadataApiService) {}

  @Get()
  getHello(): string {
    return this.metadataApiService.getHello();
  }
}
