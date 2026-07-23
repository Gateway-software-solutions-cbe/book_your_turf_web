// src/validations/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.discriminatedUnion('verification_method', [
  z.object({
    verification_method: z.literal('email'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    referral_code: z.string().optional(),
  }),
  z.object({
    verification_method: z.literal('phone'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    number: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    referral_code: z.string().optional(),
  }),
]);
export type RegisterFormValues = z.infer<typeof registerSchema>;

// Assuming 6-digit OTP (confirmed)
export const otpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit OTP'),
});
export type OtpFormValues = z.infer<typeof otpSchema>;

export const loginSchema = z.object({
  login_id: z.string().min(3, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.discriminatedUnion('verification_method', [
  z.object({
    verification_method: z.literal('email'),
    email: z.string().email('Enter a valid email'),
  }),
  z.object({
    verification_method: z.literal('phone'),
    number: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  }),
]);
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, 'Enter the 6-digit OTP'),
    new_password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
