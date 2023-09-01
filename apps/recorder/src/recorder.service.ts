import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
    CSVFileProcessor,
    Document,
    ExcelFileProcessor,
    FILE_STORAGE,
    FileManagementEntity,
    FileProcessorService,
    FileStorage,
    getFileType,
    ProcessResult,
    SharedService,
    Status,
    TransactionEntity,
    UploadFilePayload,
} from '@app/shared';
import { RmqContext } from '@nestjs/microservices';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import BackBlazeB2 from 'backblaze-b2';
import { ConfigService } from '@nestjs/config';
import sanitize from 'sanitize-filename';

@Injectable()
export class RecorderService implements OnModuleInit {
    private readonly logger = new Logger(RecorderService.name);
    private dataSource: DataSource;
    private readonly b2: BackBlazeB2;

    constructor(
        @Inject(FILE_STORAGE)
        private readonly fileStorage: FileStorage,
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(FileManagementEntity)
        private readonly fileManagementRepository: Repository<FileManagementEntity>,
        private readonly sharedService: SharedService,
        private readonly configService: ConfigService,
        private readonly fileProcessorService: FileProcessorService,
    ) {
        this.b2 = new BackBlazeB2({
            applicationKeyId: this.configService.get('B2_KEY_ID', ''),
            applicationKey: this.configService.get('B2_APP_KEY', ''),
        });
    }

    async onModuleInit(): Promise<void> {
        this.dataSource = await this.sharedService.getPostgresDataSource();
    }

    async recordTransaction(
        context: RmqContext,
        payload: UploadFilePayload,
    ): Promise<ProcessResult> {
        const fileId = payload.fileId?.toString().trim();
        const sha1 = payload.sha1?.toString().trim();
        const customerId = payload.customerId?.toString().trim();

        const result: ProcessResult = {
            status: Status.Error,
            fileId: fileId,
        };

        this.logger.debug(`Starting download file ${fileId}`);

        // Download file
        const download = await this.fileStorage.downloadFileById(fileId);
        if (download.status === Status.Error) {
            return download;
        }

        const { headers, buffer } = download;
        const fileName = sanitize(headers['x-bz-file-name']);
        const fileIdFromB2 = headers['x-bz-file-id'];
        const sha1FromB2 = headers['x-bz-content-sha1'];
        const contentType = headers['content-type'];

        // Validate the file is the correct content
        const verification = await this.fileStorage.verifyFile(fileId, sha1, {
            fileId: fileIdFromB2,
            sha1: sha1FromB2,
        });
        if (verification.status === Status.Error) {
            this.logger.error(`Invalid file ${fileName}`);
            return verification;
        }

        const docType = getFileType(contentType);
        if (this.sharedService.isNotFileSupported(docType)) {
            this.logger.error(`File extension not supported ${fileName}`);
            return {
                ...result,
                reason: 'File is not supported',
            };
        }

        // Parsing file content
        let parsedData: ProcessResult = {
            status: Status.Error,
            reason: 'Opps! Something went wrong',
        };
        if (docType === Document.Excel) {
            this.fileProcessorService.setProcessor(new ExcelFileProcessor());
            parsedData = await this.fileProcessorService.processBuffer(buffer);
        }
        if (docType === Document.Csv) {
            this.fileProcessorService.setProcessor(new CSVFileProcessor());
            parsedData = await this.fileProcessorService.processBuffer(buffer);
        }

        if (parsedData.status === Status.Error) {
            this.logger.error(`Could not parsing file ${parsedData.reason}`);
            return {
                ...result,
                reason: parsedData.reason,
            };
        }

        try {
            this.logger.debug('Data is being inserted');
            await this.transactionRepository.manager.transaction(
                async (manager) => {
                    await this.fileManagementRepository.update(
                        {
                            id: fileId,
                        },
                        {
                            status: Status.Success,
                        },
                    );

                    const data = parsedData?.data.map((tran: any) => ({
                        ...tran,
                        customer: customerId,
                        fileName,
                    }));

                    await manager.save(TransactionEntity, data, {
                        chunk: 10000,
                    });

                    this.sharedService.acknowledgeMessage(context);
                    this.logger.debug('Inserted done');
                },
            );
        } catch (e) {
            const msg = `Rejected file ${fileId} reason ${e}`;
            this.logger.error(msg);
            await this.fileManagementRepository.update(
                { id: fileId },
                {
                    status: Status.Error,
                    reason: msg,
                },
            );
            this.sharedService.rejectMessage(context);
            return {
                ...result,
                reason: e?.message,
            };
        }

        return {
            status: Status.Success,
            fileId: fileId,
        };
    }
}
