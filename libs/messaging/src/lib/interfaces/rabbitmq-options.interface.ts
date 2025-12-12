export interface RabbitMQQueueOptions {
  durable?:  boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: Record<string, any>;
}

export interface RabbitMQModuleOptions {
  urls: string[];
  queue?: string;
  queueOptions?: RabbitMQQueueOptions;
  prefetchCount?: number;
  exchange?: string;
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  routingKey?: string;
}