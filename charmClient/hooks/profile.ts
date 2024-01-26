import type { LoggedInUser } from 'models';
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

export function useSetPrimaryWallet() {
  return usePUT<{ walletId: string }, void>(`/api/profile/primary-wallet`);
}
