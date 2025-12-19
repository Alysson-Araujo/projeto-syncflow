import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessingServiceService } from '../processing-service.service';
import * as amqp from 'amqplib';

interface FileUploadedData {
  fileId: string;
  storageKey: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface MessageWrapper {
  pattern?:  string;
  data?: FileUploadedData;
}

@Injectable()
export class FileProcessor implements OnModuleInit {
  private readonly logger = new Logger(FileProcessor.name);
  private channel: amqp.Channel;

  constructor(
    private readonly processingService: ProcessingServiceService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.connectToRabbitMQ();
  }

  private async connectToRabbitMQ() {
    try {
      const rabbitmqUrl = this.configService.get(
        'RABBITMQ_URL',
        'amqp://syncflow:syncflow123@localhost: 5672'
      );

      this.logger.log(`🔌 Connecting to RabbitMQ:  ${rabbitmqUrl}`);

      const connection = await amqp.connect(rabbitmqUrl);
      this.channel = await connection.createChannel();

      await this.channel.prefetch(1);

      this.logger.log(`✅ Connected to RabbitMQ`);
      this.logger.log(`📨 Starting to consume from queue: file.uploaded`);

      await this.channel.consume(
        'file.uploaded',
        (msg) => this.handleMessage(msg),
        { noAck: false }
      );

      this.logger.log(`✅ Now consuming messages from file.uploaded`);
    } catch (error:  any) {
      this.logger.error(`❌ Failed to connect to RabbitMQ:  ${error.message}`);
      setTimeout(() => this.connectToRabbitMQ(), 5000);
    }
  }

  private async handleMessage(msg: amqp.ConsumeMessage | null) {
    if (!msg) {
      return;
    }

    
    const content = msg.content.toString();

    // ✅ LOG 1: Conteúdo recebido
  this.logger.log(`📦 Raw content received (length: ${content.length})`);
  this.logger.debug(`📦 Raw content: ${content}`);
    this.logger.debug(`📦 Raw content: ${content}`);

    let parsed: MessageWrapper | FileUploadedData;
    
    try {
      parsed = JSON.parse(content);
        // ✅ LOG 2: Conteúdo parseado
    this.logger.debug(`📦 Parsed: ${JSON.stringify(parsed, null, 2)}`);
    } catch (error) {
      this.logger.error(`❌ Invalid JSON: ${content}`);
      this.channel.nack(msg, false, false);
      return;
    }

    let data: FileUploadedData;

    if ('data' in parsed && parsed.data) {
      // ✅ LOG 3: Formato com data
    this.logger.debug(`📋 Format:  Wrapped (pattern + data)`);
      data = parsed.data;
    } else if ('fileId' in parsed) {
      // ✅ LOG 4: Formato direto
    this.logger.debug(`📋 Format: Direct`);
      data = parsed as FileUploadedData;
    } else {
      // ✅ LOG 5: Formato inválido
    this.logger.error(`   Keys found: ${Object.keys(parsed).join(', ')}`);
    this.logger.error(`   Full content: ${JSON.stringify(parsed, null, 2)}`);
      this.logger.error(`❌ Invalid message structure: ${content}`);
      this.channel.nack(msg, false, false);
      return;
    }

    if (!data.fileId) {
      this.logger.error(`❌ Missing fileId in message:  ${JSON.stringify(parsed)}`);
      this.channel.nack(msg, false, false);
      return;
    }

    this.logger.log(`📨 Received file.uploaded event`);
    this.logger.log(`   File ID: ${data.fileId}`);
    this.logger.log(`   File Name: ${data.name}`);

    try {
      await this.processingService.processFile(data.fileId);

      this.channel.ack(msg);
      this.logger.log(`✅ Message processed successfully`);
    } catch (error: any) {
      this.logger.error(`❌ Processing error: ${error.message}`);

      this.channel.nack(msg, false, false);
      this.logger.log(`❌ Message sent to DLQ`);
    }
  }
}