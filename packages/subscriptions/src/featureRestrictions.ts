import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

export const VIDEO_SIZE_LIMITS: Record<SpaceSubscriptionTier, number> = {
  readonly: 0,
  free: 20 * MB,
  bronze: 1 * GB,
  silver: 5 * GB,
  gold: 5 * GB,
  grant: 5 * GB
} as const;

export const VIDEO_SIZE_LIMITS_LABELS: Record<SpaceSubscriptionTier, string> = {
  readonly: '0MB',
  free: '20MB',
  bronze: '1GB',
  silver: '5GB',
  gold: '5GB',
  grant: '5GB'
};

export function getVideoSizeLimit(subscriptionTier?: SpaceSubscriptionTier | null) {
  return subscriptionTier ? VIDEO_SIZE_LIMITS[subscriptionTier] : VIDEO_SIZE_LIMITS.readonly;
}
