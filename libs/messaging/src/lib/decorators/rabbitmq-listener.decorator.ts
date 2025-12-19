import { applyDecorators } from '@nestjs/common';
import { MessagePattern, EventPattern, Ctx, Payload } from '@nestjs/microservices';
import { RmqContext } from '@nestjs/microservices';

export function RabbitMQListener(pattern: string) {
  return applyDecorators(MessagePattern(pattern));
}

export function RabbitMQEventListener(pattern: string) {
  return applyDecorators(EventPattern(pattern));
}

export { Ctx as RabbitMQContext, Payload as RabbitMQPayload };
export type { RmqContext };