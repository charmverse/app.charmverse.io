import type { LoggedInUser } from 'models';
import type { EmailPreferences } from 'pages/api/profile/onboarding-email';

import { useGET, usePOST, usePUT } from './helpers';

export function useSaveOnboardingEmail() {
  return usePUT<EmailPreferences, LoggedInUser>('/api/profile/onboarding-email');
}

export function useCreateUserOtp() {
  return usePOST<undefined, { code: string; uri: string; recoveryCode: string }>(`/api/profile/otp`);
}

export function useVerifyOtp() {
  return usePUT<{ code: string }, void>(`/api/profile/otp/verify`);
}

export function useActivateOtp() {
  return usePUT<undefined, void>(`/api/profile/otp/activate`);
}

export function useGetRecoveryCode() {
  return useGET<{ recoveryCode: string }>(`/api/profile/otp/recovery-code`);
}
