import { DynamicModule, Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './messaging.service';
import { RabbitMQSetupService } from './rabbitmq-setup.service';
import { RabbitMQModuleOptions } from './interfaces/rabbitmq-options.interface';
import { EventPublisherService } from './event-publisher.service';

@Global()
@Module({})
export class RabbitMQModule {
  static forRoot(options: RabbitMQModuleOptions): DynamicModule {
    return {
      module:  RabbitMQModule,
      imports:  [
        ClientsModule.register([
          {
            name:  'RABBITMQ_CLIENT',
            transport: Transport.RMQ,
            options: {
              urls: options.urls,
              queue: options.queue || 'syncflow.events',
              queueOptions: {
                durable: options.queueOptions?.durable ??  true,
              },
              noAck: true,
              persistent: true,
            },
          },
        ]),
      ],
      providers: [
        {
          provide: 'RABBITMQ_OPTIONS',
          useValue: options,
        },
        RabbitMQService,
        RabbitMQSetupService,
        EventPublisherService,
      ],
      exports: [RabbitMQService, ClientsModule, EventPublisherService],
    };
  }

  static forRootAsync(): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ConfigModule,
        ClientsModule.registerAsync([
          {
            name: 'RABBITMQ_CLIENT',
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
              const rabbitmqUrl = configService.get<string>(
                'RABBITMQ_URL',
                'amqp://guest:guest@localhost:5672'
              );

              return {
                transport:  Transport.RMQ,
                options: {
                  urls:  [rabbitmqUrl],
                  queue: 'syncflow.events',
                  queueOptions: {
                    durable:  true,
                  },
                  noAck: true,
                  persistent: true,
                },
              };
            },
            inject: [ConfigService],
          },
        ]),
      ],
      providers:  [
        RabbitMQService,
        RabbitMQSetupService,
      ],
      exports: [RabbitMQService, ClientsModule],
    };
  }
}