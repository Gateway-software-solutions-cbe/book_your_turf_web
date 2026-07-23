import type { VerificationMethod } from '../types/userAuth';

export function buildIdentifierPayload<T extends Record<string, unknown>>(
  method: VerificationMethod,
  identifier: string,
  rest: T
): T & ({ email: string } | { number: string }) {
  return method === 'email'
    ? ({ email: identifier, ...rest } as T & { email: string })
    : ({ number: identifier, ...rest } as T & { number: string });
}