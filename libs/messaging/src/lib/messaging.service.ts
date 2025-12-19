import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('✅ RabbitMQ connected successfully');
    } catch (error:  any) {
      this.logger.error(`❌ Failed to connect to RabbitMQ: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.close();
      this.logger.log('🔌 RabbitMQ connection closed');
    } catch (error: any) {
      this.logger.error(`❌ Error closing RabbitMQ connection:  ${error.message}`);
    }
  }

  async send<TResult = any, TInput = any>(
    pattern: string,
    data: TInput,
    timeoutMs = 5000,
  ): Promise<TResult> {
    try {
      this.logger.debug(`📤 Sending message: ${pattern}`);
      
      const result = await firstValueFrom(
        this.client.send<TResult, TInput>(pattern, data).pipe(timeout(timeoutMs)),
      );

      this.logger.debug(`✅ Response received for: ${pattern}`);
      return result;
    } catch (error: any) {
      this.logger.error(`❌ Error sending message with pattern ${pattern}: ${error.message}`);
      throw error;
    }
  }


  async emit<TInput = any>(pattern: string, data: TInput): Promise<void> {
    try {
      this.logger.log(`📤 Emitting event: ${pattern}`);
      
      await firstValueFrom(this.client.emit<TInput>(pattern, data));
      
      this.logger.log(`✅ Event emitted:  ${pattern}`);
    } catch (error: any) {
      this.logger.error(`❌ Error emitting event ${pattern}: ${error.message}`);
      throw error;
    }
  }

  async emitBatch<TInput = any>(events: Array<{ pattern: string; data: TInput }>): Promise<void> {
    this.logger.log(`📤 Emitting ${events.length} events in batch`);

    try {
      await Promise.all(
        events.map((event) => this.emit(event.pattern, event.data))
      );

      this.logger.log(`✅ Batch of ${events.length} events emitted successfully`);
    } catch (error: any) {
      this.logger.error(`❌ Error emitting batch: ${error.message}`);
      throw error;
    }
  }

  isConnected(): boolean {
    return !!this.client;
  }
}