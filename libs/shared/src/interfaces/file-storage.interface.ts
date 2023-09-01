import { DownloadFileType, ProcessResult } from '@app/shared/common/types';

export interface FileStorage {
    getUploadUrl(): Promise<ProcessResult>;
    verifyFile(
        fileId: string,
        sha1: string,
        other?: {
            fileId: string;
            sha1: string;
        },
    ): Promise<ProcessResult>;
    downloadFileById(fileId: string): Promise<DownloadFileType>;
}
