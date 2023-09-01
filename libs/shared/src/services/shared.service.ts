import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { Document } from '@app/shared/common/enums';

@Injectable()
export class SharedService implements OnModuleInit, OnModuleDestroy {
    private readonly RABBITMQ_USERNAME: string;
    private readonly RABBITMQ_PASSWORD: string;
    private readonly RABBITMQ_HOST: string;
    private readonly dataSource: DataSource;
    private postgresDataSource: any;
    constructor(private readonly configService: ConfigService) {
        this.RABBITMQ_USERNAME =
            this.configService.getOrThrow('RABBITMQ_USERNAME');
        this.RABBITMQ_PASSWORD =
            this.configService.getOrThrow('RABBITMQ_PASSWORD');
        this.RABBITMQ_HOST = this.configService.getOrThrow('RABBITMQ_HOST');

        this.dataSource = new DataSource({
            type: 'postgres',
            host: this.configService.get('POSTGRES_HOST'),
            port: this.configService.get('POSTGRES_PORT'),
            username: this.configService.get('POSTGRES_USER'),
            password: this.configService.get('POSTGRES_PASSWORD'),
            database: this.configService.get('POSTGRES_DB'),
            synchronize: process.env.NODE_ENV !== 'production',
        });
    }

    async onModuleDestroy(): Promise<void> {
        await this.dataSource.destroy();
    }

    async onModuleInit(): Promise<void> {
        this.postgresDataSource = await this.dataSource.initialize();
    }
    getRmqOptions(queueName: string): RmqOptions {
        return {
            transport: Transport.RMQ,
            options: {
                urls: [
                    `amqp://${this.RABBITMQ_USERNAME}:${this.RABBITMQ_PASSWORD}@${this.RABBITMQ_HOST}`,
                ],
                queue: queueName,
                queueOptions: {
                    durable: true,
                },
                noAck: false,
            },
        };
    }

    acknowledgeMessage(context: RmqContext): void {
        const channel = context.getChannelRef();
        const message = context.getMessage();
        channel.ack(message);
    }

    rejectMessage(context: RmqContext): void {
        const IS_REQUEUE = false;
        const channel = context.getChannelRef();
        const message = context.getMessage();
        channel.nack(message, false, IS_REQUEUE);
    }

    getPostgresDataSource(): Promise<DataSource> {
        if (!this.postgresDataSource) return this.dataSource.initialize();
        return this.postgresDataSource;
    }

    isNotFileSupported(fileType: string | null): boolean {
        if (
            !fileType ||
            (fileType !== Document.Csv && fileType !== Document.Excel)
        ) {
            return true;
        }

        return false;
    }
}
