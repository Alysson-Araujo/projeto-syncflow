import { NestFactory } from '@nestjs/core';
import { ProcessingServiceModule } from './processing-service.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('ProcessingService');
  const app = await NestFactory.create(ProcessingServiceModule);

  
  const port = process.env.PROCESSING_SERVICE_PORT || 3002;
  await app.listen(port);

  logger.log(`🚀 Processing Service is running on:  http://localhost:${port}`);
  logger.log(`📨 Consuming from queue: file.uploaded`);
}
bootstrap();
