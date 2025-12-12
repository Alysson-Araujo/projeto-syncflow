import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');
    const forcePathStyle = this.configService.get<boolean>(
      'AWS_S3_FORCE_PATH_STYLE',
      false
    );

    this.bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');

    this.s3Client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.logger.log(`StorageService initialized with bucket: ${this.bucket}`);
    if (endpoint) {
      this.logger.log(`Using custom endpoint: ${endpoint}`);
    }
  }

  /**
   * Gera Presigned URL para upload (PUT)
   */
  async getPresignedPutUrl(
    key: string,
    expiresIn: number = 3600,
    mimeType?: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    this.logger.debug(`Generated presigned PUT URL for key: ${key}`);
    return url;
  }

  /**
   * Verifica se objeto existe e retorna metadados
   */
  async statObject(key: string): Promise<{ size: number; etag: string }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client. send(command);

      return {
        size: response.ContentLength || 0,
        etag:  response.ETag || '',
      };
    } catch (error:  any) {
      if (error.name === 'NotFound') {
        throw new Error(`Object not found: ${key}`);
      }
      throw error;
    }
  }

  /**
   * Baixa objeto como Buffer
   */
  async getObjectBuffer(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket:  this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Converter stream para buffer
      const chunks:  Uint8Array[] = [];
      for await (const chunk of response. Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      this.logger.error(`Failed to get object ${key}: `, error);
      throw error;
    }
  }

  /**
   * Gera Presigned URL para download (GET) - opcional
   */
  async getPresignedGetUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}