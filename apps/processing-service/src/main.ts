import { NestFactory } from '@nestjs/core';
import { ProcessingServiceModule } from './processing-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ProcessingServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
