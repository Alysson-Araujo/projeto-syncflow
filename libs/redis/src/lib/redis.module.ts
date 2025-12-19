import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisCacheService } from './redis-cache.service';
import { RedisLockService } from './redis-lock.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        });
      },
      inject: [ConfigService],
    },
    RedisCacheService,
    RedisLockService,
  ],
  exports: ['REDIS_CLIENT', RedisCacheService, RedisLockService],
})
export class RedisModule {}