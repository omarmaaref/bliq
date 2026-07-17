/**
 * Categorical nature of a domain error. Kept small and closed on purpose —
 * transport layers (HTTP, RPC, ...) can map each kind to whatever status
 * shape they need without domain code knowing about them.
 */
export type DomainErrorKind =
  | 'not-found'
  | 'conflict'
  | 'invalid'
  | 'unauthorized'
  | 'forbidden';

/**
 * Base class for domain-level errors. Each subclass declares:
 *   - a stable machine readable `code` for client-side branching
 *   - a `kind` that transports map to their own vocabulary (e.g. HTTP status)
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly kind: DomainErrorKind;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
