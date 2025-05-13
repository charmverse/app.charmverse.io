import { useGET } from 'charmClient/hooks/helpers';

export function useReferralCode(userId?: string, request?: boolean) {
  return useGET<{ code: string } | null>(userId ? '/api/profile/referral' : null, { request });
}
