import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';

export const VIDEO_SIZE_LIMITS: Record<SpaceSubscriptionTier, number> = {
  readonly: 0,
  free: 20 * 1024 * 1024, // 20MB
  bronze: 1024 * 1024 * 1024, // 1GB
  silver: Infinity,
  gold: Infinity,
  grant: Infinity
} as const;

export function getVideoSizeLimit(subscriptionTier?: SpaceSubscriptionTier | null) {
  return subscriptionTier ? VIDEO_SIZE_LIMITS[subscriptionTier] : VIDEO_SIZE_LIMITS.readonly;
}
