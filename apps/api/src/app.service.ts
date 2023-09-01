import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    Customer,
    Event,
    FILE_STORAGE,
    FileManagementEntity,
    FileStorage,
    getFileType,
    Pattern,
    ProcessResult,
    RECORDER_SERVICE,
    SharedService,
    Status,
    UploadFilePayload,
} from '@app/shared';
import { ClientRMQ } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecordDto } from './dto/create-record.dto';
import { GetFileDto } from './dto/get-file.dto';

@Injectable()
export class AppService {
    protected readonly logger = new Logger(AppService.name);

    constructor(
        @Inject(RECORDER_SERVICE)
        private readonly recorderService: ClientRMQ,
        @Inject(FILE_STORAGE)
        private readonly fileStorage: FileStorage,
        @InjectRepository(FileManagementEntity)
        private readonly fileManagementRepository: Repository<FileManagementEntity>,
        private readonly eventEmitter: EventEmitter2,
        private readonly sharedService: SharedService,
    ) {}

    async getUploadUrl(): Promise<ProcessResult> {
        return this.fileStorage.getUploadUrl();
    }

    async recordFile(
        dto: CreateRecordDto,
        customer: Customer,
    ): Promise<ProcessResult> {
        const { fileId, sha1 } = dto;
        const customerId = customer.id.trim();
        const fileExists = await this.fileManagementRepository.exist({
            where: {
                id: fileId,
                sha1: sha1,
                customerId: customerId,
                status: Status.Processing,
            },
        });

        if (fileExists) {
            this.logger.debug(`File has been processing ${customerId}`);
            return {
                status: Status.Error,
                fileId: fileId,
                reason: 'File is processing',
            };
        }

        const verification = await this.fileStorage.verifyFile(fileId, sha1);
        if (verification.status === Status.Error) {
            return verification;
        }

        // Validate excel type or CSV
        const docType = getFileType(verification.contentType);
        if (this.sharedService.isNotFileSupported(docType)) {
            return {
                status: Status.Error,
                fileId: fileId,
                reason: 'File is not supported',
            };
        }

        this.logger.debug('Push to queue');
        const observable = this.recorderService.send<
            ProcessResult,
            UploadFilePayload
        >(Pattern.RecordTransaction, {
            fileId,
            sha1,
            customerId,
        });

        observable.subscribe((result) => {
            this.logger.debug('RecordServiceEvent::', JSON.stringify(result));
            this.eventEmitter.emit(Event.UpdateRecordStatus, result);
        });

        await this.fileManagementRepository.save({
            customerId,
            sha1,
            id: fileId,
            fileName: verification.fileName,
            status: Status.Processing,
        });

        return {
            status: Status.Success,
            fileId: fileId,
            message: 'File is processing',
        };
    }

    async getFile(dto: GetFileDto): Promise<ProcessResult> {
        const file = await this.fileManagementRepository.findOneBy({
            id: dto.id,
        });
        if (!file) {
            return {
                status: Status.Error,
                message: 'File not found',
            };
        }
        return {
            status: Status.Success,
            data: file,
        };
    }
}
