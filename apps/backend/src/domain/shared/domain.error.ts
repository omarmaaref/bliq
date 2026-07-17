/**
 * Base class for domain-level errors. Each subclass sets a stable machine
 * readable `code` — the HTTP layer maps codes to status + response body.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
