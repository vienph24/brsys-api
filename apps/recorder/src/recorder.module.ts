import { Module } from '@nestjs/common';
import { RecorderController } from './recorder.controller';
import { RecorderService } from './recorder.service';
import {
    FileManagementEntity,
    FileStorageModule,
    SharedModule,
    TransactionEntity,
} from '@app/shared';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@app/shared/modules/database.module';
import { FileProcessorModule } from './file-processor/file-processor.module';

@Module({
    imports: [
        SharedModule,
        DatabaseModule,
        FileProcessorModule,
        FileStorageModule,
        TypeOrmModule.forFeature([TransactionEntity, FileManagementEntity]),
    ],
    controllers: [RecorderController],
    providers: [RecorderService],
})
export class RecorderModule {}
