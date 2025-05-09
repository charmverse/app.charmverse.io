import type { UserWallet } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@packages/profile/getUser';

import type { SignatureVerificationPayloadWithAddress } from '@packages/lib/blockchain/signAndVerify';
import type { EmailPreferences } from 'pages/api/profile/onboarding-email';

import { useDELETE, useGETtrigger, usePOST, usePUT } from './helpers';

export function useSaveOnboardingEmail() {
  return usePUT<EmailPreferences, LoggedInUser>('/api/profile/onboarding-email');
}

export function useCreateOtp() {
  return usePOST<undefined, { code: string; uri: string; recoveryCode: string }>(`/api/profile/otp`);
}

export function useGetOtp() {
  return useGETtrigger<{ authCode: string }, { code: string; uri: string }>(`/api/profile/otp`);
}

export function useDeleteOtp() {
  return useDELETE<{ authCode: string }>(`/api/profile/otp`);
}

export function useActivateOtp() {
  return usePUT<{ authCode: string }, void>(`/api/profile/otp/activate`);
}

export function useResetRecoveryCode() {
  return usePUT<{ authCode: string }, { code: string; uri: string; recoveryCode: string }>(
    `/api/profile/otp/recovery-code`
  );
}

export function useVerifyRecoveryCode() {
  return usePOST<{ backupCode: string }, { user: LoggedInUser; backupCode: string }>(`/api/profile/otp/recovery-code`);
}

export function useSetPrimaryWallet() {
  return usePUT<{ walletId: string }, void>(`/api/profile/primary-wallet`);
}

export function useVerifyOtp() {
  return usePOST<{ authCode: string }, LoggedInUser>(`/api/profile/otp/verify`);
}

export function useGetTriggerUser() {
  return useGETtrigger<undefined, LoggedInUser | null>('/api/profile');
}

export function useLogin() {
  return usePOST<SignatureVerificationPayloadWithAddress, LoggedInUser | { otpRequired: true }>('/api/session/login');
}

export function useLogout() {
  return usePOST<undefined, undefined>(`/api/session/logout`);
}

export function useCreateUser() {
  return usePOST<SignatureVerificationPayloadWithAddress, LoggedInUser>('/api/profile');
}

export function useRemoveWallet() {
  return usePOST<Pick<UserWallet, 'address'>, LoggedInUser>('/api/profile/remove-wallet');
}

export function useAddUserWallets() {
  return usePOST<SignatureVerificationPayloadWithAddress, LoggedInUser>('/api/profile/add-wallets');
}
