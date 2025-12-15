import { Controller, Get, Logger } from '@nestjs/common';
import { NotificationServiceService } from './notification-service.service';

@Controller()
export class NotificationServiceController {
  private readonly logger = new Logger(NotificationServiceController.name);

  constructor(private readonly notificationService: NotificationServiceService) {}

  @Get()
  getStatus() {
    this.logger.log('Health check requested');
    return {
      service: 'notification-service',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/stats')
  getStats() {
    return this.notificationService.getStats();
  }
}