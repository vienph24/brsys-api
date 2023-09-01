import { Logger } from '@nestjs/common';
import { Stream } from 'node:stream';
import xlsx from 'node-xlsx';
import { FileProcessor } from '../file-processor.interface';
import { Headers } from '@app/shared/common/constants';
import { FileType, ProcessResult, Status } from '@app/shared';

function validateHeader(header: string[], headerExpected = Headers): boolean {
    return JSON.stringify(header) === JSON.stringify(headerExpected);
}

export class ExcelFileProcessor implements FileProcessor {
    private readonly logger = new Logger(ExcelFileProcessor.name);
    async parse(
        stream: Stream | Buffer,
        options = {
            header: Headers,
        },
    ): Promise<any> {
        const records = [];
        const sheets = xlsx.parse(stream, options);

        const headerFromSheet = Object.keys(sheets[0].data[0]);
        if (!validateHeader(headerFromSheet)) {
            throw new Error(
                `Column headers is incorrectly formatted. Expected {${Headers}}`,
            );
        }

        for (const sheet of sheets) {
            sheet.data.shift();
            records.push(sheet.data?.flat(Infinity));
        }

        return records.flat();
    }

    async process(file: FileType): Promise<ProcessResult> {
        this.logger.debug(`Processing ${file.originalname}`);
        try {
            const records = await this.parse(file.buffer);
            return {
                status: Status.Processing,
                fileName: file.originalname,
                data: records,
            };
        } catch (e) {
            this.logger.error(e);
            return {
                status: Status.Error,
                fileName: file.originalname,
                reason: e.message,
            };
        }
    }

    async processBuffer(data: any | Stream): Promise<ProcessResult> {
        try {
            const records = await this.parse(data);
            return {
                status: Status.Parsed,
                data: records,
            };
        } catch (e) {
            this.logger.error(e);
            return {
                status: Status.Error,
                reason: e.message,
            };
        }
    }
}
