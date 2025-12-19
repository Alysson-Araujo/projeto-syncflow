export interface ThumbnailSize {
  name: 'small' | 'medium' | 'large';
  width: number;
  height: number;
}

export interface ThumbnailResult {
  size: string;
  width: number;
  height: number;
  storageKey: string;
  url?:  string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  orientation?:  number;
  exif?: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  metadata?: ImageMetadata;
  thumbnails?: ThumbnailResult[];
  error?: string;
}

export interface IMediaProcessor {
  canProcess(mimeType: string): boolean;
  process(fileId: string, storageKey: string, mimeType: string): Promise<ProcessingResult>;
}