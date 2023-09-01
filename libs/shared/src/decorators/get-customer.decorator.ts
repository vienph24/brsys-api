import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCustomer = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const id = request.headers['x-consumer-id'];
        return {
            id,
        };
    },
);
