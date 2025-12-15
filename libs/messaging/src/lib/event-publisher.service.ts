import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib/callback_api';
import { promisify } from 'util';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: any = null;
  private channel: any = null;

  constructor(private readonly configService:  ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const url = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://guest:guest@localhost:5672'
    );

    return new Promise((resolve, reject) => {
      amqp.connect(url, (error, connection) => {
        if (error) {
          this.logger.error(`❌ Failed to connect to RabbitMQ:  ${error.message}`);
          return reject(error);
        }

        this.connection = connection;

        connection.on('error', (err: Error) => {
          this.logger.error(`❌ RabbitMQ connection error: ${err.message}`);
        });

        connection.on('close', () => {
          this.logger.warn('⚠️ RabbitMQ connection closed');
        });

        connection.createChannel((err, channel) => {
          if (err) {
            this.logger.error(`❌ Failed to create channel: ${err.message}`);
            return reject(err);
          }

          this.channel = channel;
          this.logger.log('✅ Event Publisher connected to RabbitMQ');
          resolve();
        });
      });
    });
  }

  private async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.channel) {
        this.channel.close(() => {
          if (this.connection) {
            this.connection.close(() => {
              this.logger.log('🔌 Event Publisher disconnected from RabbitMQ');
              resolve();
            });
          } else {
            resolve();
          }
        });
      } else if (this.connection) {
        this.connection.close(() => {
          this.logger.log('🔌 Event Publisher disconnected from RabbitMQ');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
 * Publica um evento no exchange com routing key
 */
async publish<T = any>(
  routingKey:  string,
  data: T,
  options?:  {
    exchange?: string;
    persistent?: boolean;
  }
): Promise<void> {
  if (!this.channel) {
    throw new Error('RabbitMQ channel is not initialized');
  }

  const exchange = options?.exchange || 'syncflow.events';
  const persistent = options?.persistent ??  true;

  // Formato compatível com NestJS Microservices @EventPattern
  const message = {
    pattern: routingKey,  // ← NestJS espera "pattern"
    data,                 // ← Dados diretos
  };

  const content = Buffer.from(JSON.stringify(message));

  try {
    const published = this.channel.publish(
      exchange,
      routingKey,
      content,
      {
        persistent,
        contentType: 'application/json',
        timestamp:  Date.now(),
      }
    );

    if (published) {
      this.logger.log(
        `📤 Event published: ${routingKey} → ${exchange}`
      );
    } else {
      this.logger.warn(`⚠️ Failed to publish event: ${routingKey}`);
    }
  } catch (error:  any) {
    this.logger.error(`❌ Error publishing event ${routingKey}: ${error.message}`);
    throw error;
  }
}
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}