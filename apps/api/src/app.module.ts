import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';

import {
    FileManagementEntity,
    FileStorageModule,
    RECORDER_SERVICE,
    SharedModule,
    TransactionEntity,
} from '@app/shared';
import { AppService } from './app.service';
import { FileProcessorModule } from '../../recorder/src/file-processor/file-processor.module';
import { DatabaseModule } from '@app/shared/modules/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        SharedModule.registerRMQ(
            RECORDER_SERVICE,
            process.env.RABBITMQ_QUEUE ?? 'record_queue',
        ),
        EventEmitterModule.forRoot(),
        SharedModule,
        FileProcessorModule,
        FileStorageModule,
        DatabaseModule,
        TypeOrmModule.forFeature([TransactionEntity, FileManagementEntity]),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
