import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { ProcessingServiceService } from '../processing-service.service';

interface FileUploadedData {
  fileId:  string;
  storageKey:  string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface MessageWrapper {
  pattern?: string;
  data?: FileUploadedData;
}

@Controller()
export class FileProcessor {
  private readonly logger = new Logger(FileProcessor.name);

  constructor(private readonly processingService: ProcessingServiceService) {}

  @MessagePattern('file.uploaded')
  async handleFileUploaded(
    @Payload() payload: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context. getChannelRef();
    const originalMsg = context.getMessage();
    
    // Pegar conteúdo raw
    const content = originalMsg.content.toString();
    
    this.logger. debug(`📦 Raw content: ${content}`);

    let parsed: MessageWrapper | FileUploadedData;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      this.logger.error(`❌ Invalid JSON:  ${content}`);
      channel.nack(originalMsg, false, false);
      return;
    }

    // Extrair data (pode estar em . data ou direto no root)
    let data: FileUploadedData;
    
    if ('data' in parsed && parsed.data) {
      // Formato:  { pattern:  "file.uploaded", data: {... } }
      data = parsed. data;
    } else if ('fileId' in parsed) {
      // Formato direto: { fileId: ".. .", storageKey: "...", ...  }
      data = parsed as FileUploadedData;
    } else {
      this.logger. error(`❌ Invalid message structure: ${content}`);
      channel.nack(originalMsg, false, false);
      return;
    }

    // Validar campos obrigatórios
    if (!data.fileId) {
      this.logger.error(`❌ Missing fileId in message:  ${JSON.stringify(parsed)}`);
      channel.nack(originalMsg, false, false);
      return;
    }

    this.logger.log(`📨 Received file.uploaded event`);
    this.logger.log(`   File ID: ${data.fileId}`);
    this.logger.log(`   File Name: ${data.name}`);

    try {
      await this.processingService.processFile(data. fileId);

      channel.ack(originalMsg);
      this.logger.log(`✅ Message processed successfully`);
    } catch (error: any) {
      this.logger.error(`❌ Processing error: ${error. message}`);

      channel.nack(originalMsg, false, false);
      this.logger.log(`❌ Message sent to DLQ`);
    }
  }
}