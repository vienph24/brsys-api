import { Status } from '@app/shared/common/enums';
import * as Stream from 'stream';

export type FileType = Express.Multer.File;

export type ProcessResult = {
    status: Status;
    fileId?: string;
    fileName?: string;
    data?: any;
    reason?: string;
    message?: string;
    totalRecord?: number;
    batchSize?: number;
    uploadUrl?: string;
    token?: string;
    contentType?: string;
};

export type DownloadFileType = ProcessResult & {
    headers?: any;
    buffer?: any | Stream;
};

export type MessagePayload = {
    transactions: string;
    totalRecord: number;
    batchSize: number;
    fileName: string;
    customerName: string;
};

export type UploadFilePayload = {
    fileId: string;
    sha1: string;
    customerId?: string;
};

export type Customer = {
    id: string;
};
