import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Tenta adquirir um lock.
   * @param key Identificador único do recurso (ex: file:123)
   * @param ttlSeconds Tempo de vida do lock em segundos (para evitar deadlocks se o processo morrer)
   * @returns true se adquiriu o lock, false se já estava bloqueado
   */
  async acquire(key: string, ttlSeconds: number = 60): Promise<boolean> {
    const lockKey = `lock:${key}`;
    // NX: Só define se não existir
    // EX: Expira em X segundos
    const result = await this.redis.set(lockKey, 'LOCKED', 'EX', ttlSeconds, 'NX');
    
    if (result === 'OK') {
      this.logger.debug(`Lock acquired for ${key}`);
      return true;
    }
    
    this.logger.debug(`Failed to acquire lock for ${key}`);
    return false;
  }

  /**
   * Libera o lock manualmente.
   */
  async release(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.redis.del(lockKey);
    this.logger.debug(`Lock released for ${key}`);
  }
}