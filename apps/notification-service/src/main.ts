import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationServiceModule } from './notification-service.module';


async function bootstrap() {
  const logger = new Logger('NotificationService');

  const app = await NestFactory.create(NotificationServiceModule);

  // Conectar como microservice (consumer RabbitMQ)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://syncflow:syncflow123@localhost:5672'],
      queue: 'file.processed',
      queueOptions:  {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'syncflow.events.dlq',
          'x-dead-letter-routing-key':  'file.processed',
        },
      },
      prefetchCount: 1,
      noAck: false,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.NOTIFICATION_SERVICE_PORT || 3003;
  await app.listen(port);

  logger.log(`🚀 Notification Service is running on: http://localhost:${port}`);
  logger.log(`📨 Consuming from queue: file.processed`);
}

bootstrap();