import { DynamicModule, Module } from '@nestjs/common';
import { SharedService } from '../services/shared.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
    ],
    providers: [SharedService],
    exports: [SharedService],
})
export class SharedModule {
    static registerRMQ(
        serviceName: string | symbol,
        queueName: string,
    ): DynamicModule {
        const providers = [
            {
                provide: serviceName,
                useFactory: (configService: ConfigService) => {
                    const RABBITMQ_USERNAME =
                        configService.getOrThrow('RABBITMQ_USERNAME');
                    const RABBITMQ_PASSWORD =
                        configService.getOrThrow('RABBITMQ_PASSWORD');
                    const RABBITMQ_HOST =
                        configService.getOrThrow('RABBITMQ_HOST');

                    return ClientProxyFactory.create({
                        transport: Transport.RMQ,
                        options: {
                            urls: [
                                `amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}`,
                            ],
                            queue: queueName,
                            queueOptions: {
                                durable: true,
                            },
                            noAck: false,
                            maxConnectionAttempts: 10,
                            socketOptions: {
                                heartbeatIntervalInSeconds: 120,
                                connectionOptions: {
                                    timeout: 120,
                                },
                            },
                        },
                    });
                },
                inject: [ConfigService],
            },
        ];
        return {
            module: SharedModule,
            providers: providers,
            exports: providers,
        };
    }
}
