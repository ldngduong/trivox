import { Global, Module } from '@nestjs/common';
import { R2StorageService } from './services/r2-storage.service.js';
import { StorageController } from './controllers/storage.controller.js';

@Global()
@Module({
  controllers: [StorageController],
  providers: [R2StorageService],
  exports: [R2StorageService],
})
export class StorageModule {}
