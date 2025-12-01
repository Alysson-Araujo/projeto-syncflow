import { Injectable } from '@nestjs/common';
import { s3MinIO } from '../configs/s3-minio';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {

    async getPresignedUploadUrl(bucket: string, key: string, expiresSeconds = 900) {
    const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: 'application/octet-stream',
    });
    const url = await getSignedUrl(s3MinIO, cmd, { expiresIn: expiresSeconds });
    return url;
    }
}
