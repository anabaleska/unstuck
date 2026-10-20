import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

// @Global so every module can inject DatabaseService without re-importing this module.
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
