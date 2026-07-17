import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Operator } from '../../domain/operators/operator.entity';
import { OperatorRepository } from '../../domain/operators/operator.repository';

@Controller('operators')
export class OperatorsController {
  constructor(private readonly repo: OperatorRepository) {}

  @Get()
  findAll(): Promise<Operator[]> {
    return this.repo.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Operator> {
    const operator = await this.repo.findById(id);
    if (!operator) throw new NotFoundException(`Operator ${id} not found`);
    return operator;
  }
}
