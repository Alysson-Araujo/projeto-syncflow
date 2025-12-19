import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MetadataApiModule } from './metadata-api.module';

async function bootstrap() {
  const logger = new Logger('MetadataAPI');

  const app = await NestFactory.create(MetadataApiModule);

  // CORS
  app.enableCors();

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Retorna erro se houver propriedades extras
      transform: true,            // Transforma tipos automaticamente (string → number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('SyncFlow - Metadata API')
    .setDescription('API para consulta de arquivos processados')
    .setVersion('1.0')
    .addTag('files', 'Gerenciamento de arquivos')
    .addTag('stats', 'Estatísticas do sistema')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.METADATA_API_PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Metadata API is running on:  http://localhost:${port}/api`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();