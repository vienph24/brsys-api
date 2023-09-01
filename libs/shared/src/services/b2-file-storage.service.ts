import {
    Injectable,
    InternalServerErrorException,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { FileStorage } from '@app/shared/interfaces/file-storage.interface';
import BackBlazeB2 from 'backblaze-b2';
import { ConfigService } from '@nestjs/config';
import { DownloadFileType, ProcessResult, Status } from '@app/shared';

@Injectable()
export class B2FileStorageService implements FileStorage, OnModuleInit {
    private readonly logger = new Logger(B2FileStorageService.name);

    private readonly B2_BUCKET_ID: string;
    private readonly b2: BackBlazeB2;
    constructor(private readonly configService: ConfigService) {
        this.B2_BUCKET_ID = this.configService.get('B2_BUCKET_ID', '');
        this.b2 = new BackBlazeB2({
            applicationKeyId: this.configService.get('B2_KEY_ID', ''),
            applicationKey: this.configService.get('B2_APP_KEY', ''),
        });
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.b2.authorize();
            this.logger.debug('Backblaze B2 has been authenticated');
        } catch (e) {
            const { code, message } = e.response?.data;
            throw new InternalServerErrorException({ code, message });
        }
    }

    async downloadFileById(fileId: string): Promise<DownloadFileType> {
        const timer = 'Download completed in';
        try {
            await this.b2.authorize();
            console.time(timer);
            const download = await this.b2.downloadFileById({
                fileId: fileId,
                responseType: 'arraybuffer',
            });
            console.timeEnd(timer);

            if (parseInt(download.status) !== 200) {
                this.logger.error(`File download failed ${fileId}`);
                return {
                    status: Status.Error,
                    fileId: fileId,
                    reason: 'Could not download file',
                };
            }

            return {
                status: Status.Success,
                fileId: fileId,
                headers: download['headers'],
                buffer: download.data,
            };
        } catch (e) {
            const { code, message } = e.response?.data;
            this.logger.error(JSON.stringify({ code, message }));
            return {
                status: Status.Error,
                fileId: fileId,
                reason: 'Error when download file',
            };
        }
    }

    async getUploadUrl(): Promise<ProcessResult> {
        try {
            await this.b2.authorize();
            const { data } = await this.b2.getUploadUrl({
                bucketId: this.B2_BUCKET_ID,
            });
            return {
                status: Status.Success,
                uploadUrl: data.uploadUrl,
                token: data.authorizationToken,
                message: 'Note: Only supported Excel or CSV files',
            };
        } catch (e) {
            const { code, message } = e.response?.data;
            this.logger.error(JSON.stringify({ code, message }));
            return {
                status: Status.Error,
                reason: 'Error get upload URL',
            };
        }
    }

    async getFileInfo(
        fileId: string,
    ): Promise<ProcessResult & { sha1?: string }> {
        try {
            await this.b2.authorize();
            const { data } = await this.b2.getFileInfo({ fileId: fileId });
            return {
                status: Status.Success,
                fileId: fileId,
                sha1: data.contentSha1,
                contentType: data.contentType,
                fileName: data.fileName,
            };
        } catch (e) {
            const { code, message } = e.response?.data;
            this.logger.error(JSON.stringify({ code, message }));
            return {
                status: Status.Error,
                fileId: fileId,
                reason: 'File not found',
            };
        }
    }

    async verifyFile(
        fileId: string,
        sha1: string,
        other?: {
            fileId: string;
            sha1: string;
        },
    ): Promise<ProcessResult> {
        let fileIdFromB2;
        let sha1FromB2;
        let contentType;
        let fileName;

        if (other) {
            fileIdFromB2 = other.fileId;
            sha1FromB2 = other.sha1;
        } else {
            await this.b2.authorize();
            const fileInfo = await this.getFileInfo(fileId);
            if (fileInfo.status === Status.Error) {
                return fileInfo;
            }
            fileIdFromB2 = fileInfo.fileId;
            sha1FromB2 = fileInfo.sha1;
            contentType = fileInfo.contentType;
            fileName = fileInfo.fileName;
        }

        if (fileId !== fileIdFromB2 || sha1 !== sha1FromB2) {
            return {
                status: Status.Error,
                fileId: fileId,
                message: 'Invalid file',
            };
        }

        return {
            status: Status.Success,
            contentType: contentType,
            fileName: fileName,
        };
    }
}
