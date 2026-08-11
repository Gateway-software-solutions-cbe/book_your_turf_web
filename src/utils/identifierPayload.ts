// src/utils/identifierPayload.ts
import type { VerificationMethod } from '../types/user/userAuth';

/**
 * Builds a payload with the identifier field
 * @param verificationMethod - 'email' or 'phone' (for reference)
 * @param identifier - The actual email address or phone number as a string
 * @param extra - Additional fields to include
 * @returns The payload object with identifier as string
 */
export const buildIdentifierPayload = <T extends Record<string, unknown>>(
  verificationMethod: VerificationMethod,
  identifier: string,
  extra: T = {} as T
): { identifier: string } & T => {
  return {
    identifier,
    ...extra,
  };
};

/**
 * Gets the actual identifier value from form values
 * @param verificationMethod - 'email' or 'phone'
 * @param values - Form values containing email or number
 * @returns The actual email or number as a string
 */
export const getIdentifierFromValues = (
  verificationMethod: VerificationMethod,
  values: { email?: string; number?: string }
): string => {
  return verificationMethod === 'email' ? values.email! : values.number!;
};