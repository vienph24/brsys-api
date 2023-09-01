import { Stream } from 'node:stream';
import { FileType, ProcessResult } from '@app/shared';

export interface FileProcessor {
    parse(stream: Stream, options?: any): Promise<any>;
    process(file: FileType): Promise<ProcessResult>;
    processBuffer(data: any): Promise<ProcessResult>;
}
