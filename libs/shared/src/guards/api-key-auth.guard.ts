import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
    private readonly logger = new Logger(ApiKeyAuthGuard.name);
    private readonly API_KEY: string;
    constructor(private readonly configService: ConfigService) {
        this.API_KEY = this.configService.getOrThrow('API_KEY');
    }
    canActivate(context: ExecutionContext) {
        if (context.getType() !== 'http') {
            return false;
        }
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];
        const customerId = request.headers['x-consumer-id'];
        if (!apiKey || !customerId) {
            throw new UnauthorizedException(
                'Missing x-api-key or x-consumer-id',
            );
        }

        if (apiKey !== this.API_KEY) {
            throw new UnauthorizedException('The x-api-key is incorrectly');
        }
        return true;
    }
}
