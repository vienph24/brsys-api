import { NestFactory } from '@nestjs/core';
import { RecorderModule } from './recorder.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { SharedService } from '@app/shared';

async function bootstrap() {
    const app = await NestFactory.create(RecorderModule);
    const configService = app.get(ConfigService);
    const sharedService = app.get(SharedService);

    const QUEUE = configService.getOrThrow('RABBITMQ_RECORD_QUEUE');

    app.connectMicroservice<MicroserviceOptions>(
        sharedService.getRmqOptions(QUEUE),
    );

    await app.startAllMicroservices();
}
bootstrap();
