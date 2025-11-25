import { Injectable } from '@nestjs/common';

@Injectable()
export class ProcessingServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
