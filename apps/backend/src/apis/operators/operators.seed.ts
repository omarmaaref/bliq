import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { OperatorRepository } from '../../domain/operators/operator.repository';

const SEED_OPERATORS: ReadonlyArray<{ name: string }> = [
  { name: 'Alice Nakamura' },
  { name: 'Bruno Silva' },
  { name: 'Chen Wei' },
  { name: 'Dara Okonkwo' },
];

@Injectable()
export class OperatorsSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(OperatorsSeed.name);

  constructor(private readonly repo: OperatorRepository) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.repo.findAll();
    if (existing.length > 0) {
      this.logger.log(
        `Skipping seed: ${existing.length} operator(s) already present`,
      );
      return;
    }

    const created = await Promise.all(
      SEED_OPERATORS.map((o) => this.repo.create(o)),
    );
    this.logger.log(
      `Seeded ${created.length} operators: ${created
        .map((o) => `${o.name} (${o.id})`)
        .join(', ')}`,
    );
  }
}
