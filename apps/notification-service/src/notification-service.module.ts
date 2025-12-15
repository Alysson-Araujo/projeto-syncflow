import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '@app/email';
import { RabbitMQModule } from '@app/messaging';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationServiceService } from './notification-service.service';
import { FileNotificationProcessor } from './processors/file-notification.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailModule,
    RabbitMQModule.forRootAsync(),
  ],
  controllers: [NotificationServiceController, FileNotificationProcessor],
  providers: [NotificationServiceService],
})
export class NotificationServiceModule {}