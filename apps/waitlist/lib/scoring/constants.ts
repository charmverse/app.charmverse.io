import { prisma } from '@charmverse/core/prisma-client';
import { roundNumberInRange } from '@root/lib/utils/numbers';

export const waitlistTiers = ['legendary', 'mythic', 'epic', 'rare', 'common'] as const;

export type ConnectWaitlistTier = (typeof waitlistTiers)[number];

export type TierChange = 'none' | 'up' | 'down';

export const tierDistribution: { tier: ConnectWaitlistTier; threshold: number; totalPercentSize: number }[] = [
  { tier: 'legendary', threshold: 96, totalPercentSize: 5 },
  { tier: 'mythic', threshold: 81, totalPercentSize: 15 },
  { tier: 'epic', threshold: 61, totalPercentSize: 20 },
  { tier: 'rare', threshold: 31, totalPercentSize: 30 },
  { tier: 'common', threshold: 1, totalPercentSize: 30 }
];

export function getTier(percentile: number): ConnectWaitlistTier {
  return tierDistribution.find(({ threshold }) => percentile >= threshold)?.tier || 'common';
}

export const tierColors: Record<ConnectWaitlistTier, string> = {
  common: '#b2bec0',
  rare: '#ecb366',
  epic: '#e79b81',
  mythic: '#dd77ea',
  legendary: '#b293f1'
};
