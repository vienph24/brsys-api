import {
    Body,
    Controller,
    Get,
    Logger,
    Param,
    Post,
    Sse,
    UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fromEvent, map, Observable } from 'rxjs';
import { AppService } from './app.service';
import { Customer, Event, GetCustomer, ProcessResult } from '@app/shared';
import { CreateRecordDto } from './dto/create-record.dto';
import { ApiKeyAuthGuard } from '@app/shared/guards/api-key-auth.guard';
import { GetFileDto } from './dto/get-file.dto';

@Controller()
export class AppController {
    constructor(
        private eventEmitter: EventEmitter2,
        private readonly appService: AppService,
    ) {}

    @Sse('events')
    handleWrittenRecordEvent(): Observable<any> {
        return fromEvent(this.eventEmitter, Event.UpdateRecordStatus).pipe(
            map((data) => {
                Logger.log(
                    `RecordService::${data}`,
                    this.handleWrittenRecordEvent.name,
                );
                return JSON.stringify(data);
            }),
        );
    }

    @UseGuards(ApiKeyAuthGuard)
    @Get('upload-url')
    async getUploadUrl(): Promise<ProcessResult> {
        return this.appService.getUploadUrl();
    }

    @UseGuards(ApiKeyAuthGuard)
    @Post('records')
    async recordFile(
        @GetCustomer() customer: Customer,
        @Body() dto: CreateRecordDto,
    ) {
        return this.appService.recordFile(dto, customer);
    }

    @UseGuards(ApiKeyAuthGuard)
    @Get('records/:id')
    async getFile(@Param() dto: GetFileDto): Promise<ProcessResult> {
        return this.appService.getFile(dto);
    }
}
