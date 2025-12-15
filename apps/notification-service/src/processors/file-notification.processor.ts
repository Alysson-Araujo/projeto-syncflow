import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationServiceService } from '../notification-service.service';

interface FileProcessedData {
  fileId: string;
  storageKey: string;
  name: string;
  hash: string;
  metadata: {
    name: string;
    mimeType: string;
    size:  number;
    uploadedAt:  string;
  };
  processedAt: string;
}

interface MessageWrapper {
  pattern?:  string;
  data?: FileProcessedData;
}

@Controller()
export class FileNotificationProcessor {
  private readonly logger = new Logger(FileNotificationProcessor.name);

  constructor(private readonly notificationService: NotificationServiceService) {}

  @MessagePattern('file.processed')
  async handleFileProcessed(
    @Payload() payload: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Pegar conteúdo raw
    const content = originalMsg.content.toString();

    this.logger.debug(`📦 Raw content: ${content}`);

    let parsed: MessageWrapper | FileProcessedData;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      this.logger.error(`❌ Invalid JSON: ${content}`);
      channel.nack(originalMsg, false, false);
      return;
    }

    // Extrair data
    let data: FileProcessedData;

    if ('data' in parsed && parsed.data) {
      data = parsed.data;
    } else if ('fileId' in parsed) {
      data = parsed as FileProcessedData;
    } else {
      this.logger.error(`❌ Invalid message structure: ${content}`);
      channel.nack(originalMsg, false, false);
      return;
    }

    // Validar campos obrigatórios
    if (!data.fileId || !data.name) {
      this.logger.error(`❌ Missing required fields in message: ${JSON.stringify(parsed)}`);
      channel.nack(originalMsg, false, false);
      return;
    }

    this.logger.log(`📨 Received file.processed event`);
    this.logger.log(`   File ID: ${data.fileId}`);
    this.logger.log(`   File Name: ${data.name}`);
    this.logger.log(`   Hash: ${data.hash}`);

    try {
      await this.notificationService.notifyFileProcessed(data);

      channel.ack(originalMsg);
      this.logger.log(`✅ Notification processed successfully`);
    } catch (error: any) {
      this.logger.error(`❌ Notification error: ${error.message}`);

      channel.nack(originalMsg, false, false);
      this.logger.log(`❌ Message sent to DLQ`);
    }
  }
}