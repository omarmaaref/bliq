import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';

export const OPERATOR_ID_HEADER = 'x-operator-id';

/**
 * Extracts the acting operator's id from the `x-operator-id` request header.
 * Throws a 400 when the header is missing.
 */
export const OperatorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const raw = req.headers[OPERATOR_ID_HEADER];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) {
      throw new BadRequestException(`Missing ${OPERATOR_ID_HEADER} header`);
    }
    return value;
  },
);
