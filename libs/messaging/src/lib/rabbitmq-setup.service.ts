import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';

@Injectable()
export class RabbitMQSetupService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQSetupService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.setupInfrastructure();
  }

  private async setupInfrastructure() {
    const url = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://guest:guest@localhost:5672'
    );

    this.logger.log('🚀 Setting up RabbitMQ infrastructure...');

    try {
      const connection = await connect(url);
      const channel = await connection.createChannel();

      // 1. Criar exchange principal (topic)
      await channel.assertExchange('syncflow.events', 'topic', {
        durable: true,
      });
      this.logger.log('✅ Exchange created: syncflow.events (topic)');

      // 2. Criar queues para eventos específicos
      const queueConfigs = [
        { name: 'file.uploaded', routingKey: 'file.uploaded' },
        { name: 'file.processed', routingKey: 'file.processed' },
        { name: 'file.failed', routingKey: 'file.failed' },
      ];

      for (const config of queueConfigs) {
        // Criar queue
        await channel.assertQueue(config.name, {
          durable: true,
          arguments: {
            // Configurar DLQ
            'x-dead-letter-exchange':  'syncflow.events.dlq',
            'x-dead-letter-routing-key': config.name,
          },
        });
        this.logger.log(`✅ Queue created: ${config. name}`);

        // Bind queue ao exchange com routing key
        await channel.bindQueue(
          config.name,
          'syncflow.events',
          config.routingKey
        );
        this.logger. log(
          `✅ Binding created: ${config.name} <- syncflow.events (${config.routingKey})`
        );
      }

      // 3. Criar exchange DLQ
      await channel.assertExchange('syncflow.events.dlq', 'direct', {
        durable: true,
      });
      this.logger.log('✅ DLQ Exchange created: syncflow.events.dlq');

      // 4. Criar queues DLQ
      for (const config of queueConfigs) {
        const dlqName = `${config.name}.dlq`;
        await channel.assertQueue(dlqName, {
          durable: true,
        });

        await channel.bindQueue(
          dlqName,
          'syncflow.events.dlq',
          config.name
        );
        this.logger.log(`✅ DLQ Queue created: ${dlqName}`);
      }

      await channel.close();
      await connection.close();

      this.logger.log('✅ RabbitMQ infrastructure setup completed!');
    } catch (error:  any) {
      this.logger.error(
        `❌ Failed to setup RabbitMQ infrastructure:  ${error.message}`
      );
      // Não lançar erro para não travar a aplicação
    }
  }
}