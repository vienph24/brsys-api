import { Injectable } from '@nestjs/common';
import { FileProcessor } from './file-processor.interface';
import { FileType, ProcessResult } from '@app/shared';

@Injectable()
export class FileProcessorService {
    private processor: FileProcessor;

    setProcessor(processor: FileProcessor): void {
        this.processor = processor;
    }

    async process(file: FileType): Promise<ProcessResult> {
        return this.processor.process(file);
    }

    async processBuffer(data: any): Promise<ProcessResult> {
        return this.processor.processBuffer(data);
    }
}
