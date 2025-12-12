import { IsUUID } from 'class-validator';

export class CompleteUploadDto {
  @IsUUID()
  id! : string;
}

export class CompleteUploadResponseDto {
  id! : string;
  name! : string;
  storageKey!: string;
  status! : string;
  size!:  number;
  formattedSize!: string;
  mimeType!: string;
  hash?: string;
  createdAt!: Date;
  updatedAt!: Date;
}