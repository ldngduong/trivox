export interface StorageUploadResult {
  key: string;
  url: string;
  provider: 'r2' | 'local';
}

export interface StorageStatus {
  isR2Configured: boolean;
  bucketName: string;
  accountId: string;
  publicUrl: string;
}
