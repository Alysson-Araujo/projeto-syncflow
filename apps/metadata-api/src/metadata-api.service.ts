import { Injectable } from '@nestjs/common';

@Injectable()
export class MetadataApiService {
  getHello(): string {
    return 'Hello World!';
  }
}
