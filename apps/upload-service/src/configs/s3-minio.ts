import { S3Client } from "@aws-sdk/client-s3";

export const s3MinIO = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:9000',
    credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true, // importante para MinIO
  })