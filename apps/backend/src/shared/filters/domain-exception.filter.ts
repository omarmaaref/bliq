import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../domain/shared/domain.error';

/**
 * Maps DomainError subclasses to HTTP responses. Add new codes here as domain
 * errors grow. Anything not in the table defaults to 409 Conflict since domain
 * errors typically represent rule violations.
 */
const CODE_TO_STATUS: Record<string, number> = {
  VEHICLE_NOT_FOUND: HttpStatus.NOT_FOUND,
  OPERATOR_NOT_FOUND: HttpStatus.NOT_FOUND,
  VEHICLE_OFFLINE: HttpStatus.CONFLICT,
  VEHICLE_ALREADY_ASSIGNED: HttpStatus.CONFLICT,
  OPERATOR_ALREADY_HAS_VEHICLE: HttpStatus.CONFLICT,
  VEHICLE_NOT_HELD_BY_OPERATOR: HttpStatus.CONFLICT,
  CANNOT_OFFLINE_ASSIGNED_VEHICLE: HttpStatus.CONFLICT,
};

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = CODE_TO_STATUS[exception.code] ?? HttpStatus.CONFLICT;

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
