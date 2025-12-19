import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,  // ✅ ADICIONAR
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

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
  }

  async generatePresignedPutUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket:  this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    this.logger.debug(`🔗 Generated presigned PUT URL for: ${key}`);

    return url;
  }

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

  async getObjectStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (! response.Body) {
      throw new Error(`No body returned for key: ${key}`);
    }

    return response.Body as Readable;
  }

  // ✅ ADICIONAR ESTE MÉTODO
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.debug(`✅ File exists in S3: ${key}`);
      return true;
    } catch (error:  any) {
      if (error.name === 'NotFound' || error.$metadata?. httpStatusCode === 404) {
        this.logger.debug(`❌ File not found in S3: ${key}`);
        return false;
      }
      
      // Outro tipo de erro (permissão, rede, etc.)
      this.logger.error(`Error checking file existence: ${error.message}`);
      throw error;
    }
  }

  // ✅ ADICIONAR ESTE MÉTODO
  async getObjectMetadata(key: string): Promise<{
    ContentLength?:  number;
    ContentType?: string;
    LastModified?: Date;
    ETag?: string;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this. s3Client.send(command);

      this.logger.debug(`📋 Metadata retrieved for: ${key}`);

      return {
        ContentLength:  response.ContentLength,
        ContentType: response.ContentType,
        LastModified: response.LastModified,
        ETag:  response.ETag,
      };
    } catch (error: any) {
      this.logger. error(`Error getting metadata for ${key}: ${error.message}`);
      throw error;
    }
  }
}