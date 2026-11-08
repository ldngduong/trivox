import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Readable } from 'node:stream';
import type {
  StorageStatus,
  StorageUploadResult,
} from '../interfaces/storage.interface.js';

@Injectable()
export class R2StorageService implements OnModuleInit {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly localRoot = path.resolve(process.cwd(), 'storage');
  private bucketName = 'trivox-assets';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    fs.mkdirSync(this.localRoot, { recursive: true });
    this.bucketName =
      this.config.get<string>('R2_BUCKET_NAME') || 'trivox-assets';
    await this.initR2Client();
  }

  private async initR2Client() {
    const accountId = (this.config.get<string>('R2_ACCOUNT_ID') || '').trim();
    const accessKeyId = (
      this.config.get<string>('R2_ACCESS_KEY_ID') || ''
    ).trim();
    const secretAccessKey = (
      this.config.get<string>('R2_SECRET_ACCESS_KEY') || ''
    ).trim();

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.s3Client = null;
      return;
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.logger.log(
        `Connected to Cloudflare R2 bucket "${this.bucketName}"`,
      );
    } catch {
      try {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(
          `Created Cloudflare R2 bucket "${this.bucketName}" automatically`,
        );
      } catch (err) {
        this.logger.warn(
          `Could not verify/create R2 bucket "${this.bucketName}": ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        );
      }
    }
  }

  getStatus(): StorageStatus {
    const accountId = (this.config.get<string>('R2_ACCOUNT_ID') || '').trim();
    const publicUrl = (this.config.get<string>('R2_PUBLIC_URL') || '').trim();
    return {
      isR2Configured: Boolean(this.s3Client),
      bucketName: this.bucketName,
      accountId: accountId ? `${accountId.slice(0, 6)}...` : '',
      publicUrl,
    };
  }

  getTempBuildPath(projectId: string, version: number): string {
    const dir = path.join(this.localRoot, 'builds');
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${projectId}-v${version}.glb`);
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<StorageUploadResult> {
    const normalizedKey = key.replace(/^\/+/, '').replace(/\\/g, '/');
    const localFilePath = path.join(this.localRoot, normalizedKey);
    fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
    fs.writeFileSync(localFilePath, buffer);

    const publicBaseUrl = (
      this.config.get<string>('R2_PUBLIC_URL') || ''
    ).trim();

    if (this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: normalizedKey,
            Body: buffer,
            ContentType: contentType,
          }),
        );

        const url = publicBaseUrl
          ? `${publicBaseUrl.replace(/\/+$/, '')}/${normalizedKey}`
          : `/api/storage/${normalizedKey}`;

        return {
          key: normalizedKey,
          url,
          provider: 'r2',
        };
      } catch (err) {
        this.logger.warn(
          `R2 upload failed for ${normalizedKey}, serving from local storage: ${
            err instanceof Error ? err.message : 'Unknown'
          }`,
        );
      }
    }

    return {
      key: normalizedKey,
      url: `/api/storage/${normalizedKey}`,
      provider: 'local',
    };
  }

  async uploadBase64Image(
    keyPrefix: string,
    dataUri: string,
  ): Promise<StorageUploadResult> {
    const match = dataUri.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    const contentType = match ? match[1] : 'image/png';
    const rawBase64 = match ? match[2] : dataUri;
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const key = `${keyPrefix}.${ext}`;
    const buffer = Buffer.from(rawBase64, 'base64');
    return this.uploadBuffer(key, buffer, contentType);
  }

  async readAsset(
    key: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    const normalizedKey = key.replace(/^\/+/, '').replace(/\\/g, '/');
    const localFilePath = path.join(this.localRoot, normalizedKey);

    if (fs.existsSync(localFilePath)) {
      return {
        buffer: fs.readFileSync(localFilePath),
        contentType: this.guessContentType(normalizedKey),
      };
    }

    if (this.s3Client) {
      try {
        const res = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: normalizedKey,
          }),
        );
        if (res.Body) {
          const chunks: Buffer[] = [];
          for await (const chunk of res.Body as Readable) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const buffer = Buffer.concat(chunks);
          fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
          fs.writeFileSync(localFilePath, buffer);
          return {
            buffer,
            contentType:
              res.ContentType || this.guessContentType(normalizedKey),
          };
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  private guessContentType(key: string): string {
    const lower = key.toLowerCase();
    if (lower.endsWith('.glb')) return 'model/gltf-binary';
    if (lower.endsWith('.blend')) return 'application/x-blender';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.webp')) return 'image/webp';
    return 'application/octet-stream';
  }
}
