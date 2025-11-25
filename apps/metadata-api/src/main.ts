import { NestFactory } from '@nestjs/core';
import { MetadataApiModule } from './metadata-api.module';

async function bootstrap() {
  const app = await NestFactory.create(MetadataApiModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
