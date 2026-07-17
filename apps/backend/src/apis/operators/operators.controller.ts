import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Operator } from '../../domain/operators/operator.entity';
import { OperatorRepository } from '../../domain/operators/operator.repository';
import {
  operatorFreeExample,
  operatorListExample,
  operatorNotFoundExample,
} from './openapi';

@ApiTags('operators')
@Controller('operators')
export class OperatorsController {
  constructor(private readonly repo: OperatorRepository) {}

  @Get()
  @ApiOperation({ summary: 'List all operators (seeded on app boot).' })
  @ApiOkResponse({ example: operatorListExample })
  findAll(): Promise<Operator[]> {
    return this.repo.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single operator by id.' })
  @ApiParam({ name: 'id', example: operatorFreeExample.id })
  @ApiOkResponse({ example: operatorFreeExample })
  @ApiNotFoundResponse({ example: operatorNotFoundExample })
  async findOne(@Param('id') id: string): Promise<Operator> {
    const operator = await this.repo.findById(id);
    if (!operator) throw new NotFoundException(`Operator ${id} not found`);
    return operator;
  }
}
