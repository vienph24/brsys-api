import { Logger } from '@nestjs/common';
import { Readable, Stream } from 'node:stream';
import csvParser from 'csv-parser';
import { FileType, Headers, ProcessResult, Status } from '@app/shared';
import { FileProcessor } from '../file-processor.interface';

export class CSVFileProcessor implements FileProcessor {
    private readonly logger = new Logger(CSVFileProcessor.name);
    parse(
        stream: Stream,
        options = {
            headers: Headers,
        },
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const records: any[] = [];
            const pipedStream = stream.pipe(
                csvParser({
                    strict: true,
                    ...options,
                }),
            );
            pipedStream.on('error', () => {
                reject(
                    'This is not a valid CSV file, or its format is not currently supported',
                );
            });
            pipedStream.on('data', (data) => records.push(data));
            pipedStream.on('end', () => {
                records.shift();
                resolve(records);
            });
        });
    }

    async process(file: FileType): Promise<ProcessResult> {
        this.logger.debug(`Processing ${file.originalname}`);
        const readable = Readable.from(file.buffer);
        try {
            const records = await this.parse(readable);
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
                reason: e.message ?? e,
            };
        }
    }

    async processBuffer(data: any | Stream): Promise<ProcessResult> {
        const readable = Readable.from(data);
        try {
            const records = await this.parse(readable);
            return {
                status: Status.Processing,
                data: records,
            };
        } catch (e) {
            this.logger.error(e);
            return {
                status: Status.Error,
                reason: e.message ?? e,
            };
        }
    }
}
