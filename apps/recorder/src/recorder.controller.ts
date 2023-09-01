import { Controller } from '@nestjs/common';
import { RecorderService } from './recorder.service';
import {
    Ctx,
    MessagePattern,
    Payload,
    RmqContext,
} from '@nestjs/microservices';
import { Pattern, ProcessResult, UploadFilePayload } from '@app/shared';

@Controller()
export class RecorderController {
    constructor(private readonly recorderService: RecorderService) {}

    @MessagePattern(Pattern.RecordTransaction)
    async handleFileUploaded(
        @Payload()
        payload: UploadFilePayload,
        @Ctx() context: RmqContext,
    ): Promise<ProcessResult> {
        return this.recorderService.recordTransaction(context, payload);
    }
}
