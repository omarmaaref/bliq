import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError, DomainErrorKind } from '../../domain/shared/domain.error';

/**
 * Generic HTTP mapping for domain errors. New DomainError subclasses just need
 * to declare their `kind` — no table update here required.
 *
 * Non-HTTP contexts (WebSocket, RPC, ...) rethrow: the transport-specific
 * filter chain handles them, and this filter never touches transport APIs it
 * doesn't own.
 */
const KIND_TO_STATUS: Record<DomainErrorKind, number> = {
  'not-found': HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  invalid: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
};

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    if (host.getType() !== 'http') throw exception;

    const response = host.switchToHttp().getResponse<Response>();
    const status = KIND_TO_STATUS[exception.kind];

    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
    });
  }
}
