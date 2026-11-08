import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { R2StorageService } from '../services/r2-storage.service.js';

@Controller('api/storage')
export class StorageController {
  constructor(private readonly storageService: R2StorageService) {}

  @Get('status')
  getStatus() {
    return this.storageService.getStatus();
  }

  @Get('*key')
  async serveObject(
    @Param('key') keyParam: string | string[],
    @Res() res: Response,
  ) {
    const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;
    const asset = await this.storageService.readAsset(key);
    if (!asset) {
      throw new NotFoundException('Tệp lưu trữ không tồn tại.');
    }
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.send(asset.buffer);
  }
}
