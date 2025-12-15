import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '@app/email';

interface FileProcessedData {
  fileId: string;
  storageKey: string;
  name: string;
  hash: string;
  metadata: {
    name: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  };
  processedAt: string;
}

@Injectable()
export class NotificationServiceService {
  private readonly logger = new Logger(NotificationServiceService.name);
  private stats = {
    emailsSent: 0,
    emailsFailed: 0,
    startTime: new Date(),
  };

  constructor(private readonly emailService: EmailService) {}

  async notifyFileProcessed(data: FileProcessedData): Promise<void> {
    this.logger.log(`📧 Sending notification for file: ${data.name}`);

    // TODO: Em produção, buscar email do usuário no banco
    // Por enquanto, usar email de teste do .env
    const userEmail = process.env.TEST_EMAIL || 'test@example.com';

    try {
      await this.emailService.sendFileProcessedEmail({
        email: userEmail,
        fileName: data.name,
        fileId: data.fileId,
        hash: data.hash,
        size: data.metadata.size,
        processedAt: data.processedAt,
      });

      this.stats.emailsSent++;
      this.logger.log(`✅ Notification sent to ${userEmail}`);
    } catch (error:  any) {
      this.stats.emailsFailed++;
      this.logger.error(`❌ Failed to send notification:  ${error.message}`);
      throw error;
    }
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();

    return {
      emailsSent: this.stats.emailsSent,
      emailsFailed: this.stats.emailsFailed,
      uptime: Math.floor(uptime / 1000),
      startTime: this.stats.startTime,
    };
  }
}