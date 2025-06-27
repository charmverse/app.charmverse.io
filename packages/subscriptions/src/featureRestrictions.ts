import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { InvalidInputError } from '@packages/core/errors';
import type { TokenGateConditions } from '@packages/lib/tokenGates/interfaces';
import { capitalize } from 'lodash';

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

const VIDEO_SIZE_LIMITS: Record<SpaceSubscriptionTier, number> = {
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

const TOKEN_GATE_LIMITS: Record<SpaceSubscriptionTier, { count: number; restrictedChains: boolean }> = {
  readonly: { count: 0, restrictedChains: false },
  free: { count: 1, restrictedChains: true },
  bronze: { count: 1, restrictedChains: true },
  silver: { count: 3, restrictedChains: false },
  gold: { count: Infinity, restrictedChains: false },
  grant: { count: Infinity, restrictedChains: false }
} as const;

export const RESTRICTED_TOKEN_GATE_CHAINS = ['ethereum'] as const;

type TokenGatePayload = {
  subscriptionTier: SpaceSubscriptionTier | null;
  conditions?: TokenGateConditions['accessControlConditions'];
  existingTokenGates: number;
};

export function getTokenGateLimits(subscriptionTier: SpaceSubscriptionTier | null) {
  return subscriptionTier ? TOKEN_GATE_LIMITS[subscriptionTier] : TOKEN_GATE_LIMITS.readonly;
}

export async function validateTokenGateRestrictions(payload: TokenGatePayload) {
  const { subscriptionTier, conditions = [], existingTokenGates } = payload;

  const limits = subscriptionTier ? TOKEN_GATE_LIMITS[subscriptionTier] : TOKEN_GATE_LIMITS.readonly;

  if (existingTokenGates >= limits.count) {
    throw new InvalidInputError(
      `You have reached the maximum number of token gates (${limits.count}) for your subscription tier`
    );
  }

  // Check chain restrictions only for public and bronze tiers
  if (limits.restrictedChains) {
    const unsupportedChains = conditions
      .map((condition) => getChainById(condition.chain)?.chainName.toLowerCase())
      .filter(
        (chain) => !RESTRICTED_TOKEN_GATE_CHAINS.includes(chain as (typeof RESTRICTED_TOKEN_GATE_CHAINS)[number])
      );

    if (unsupportedChains.length > 0) {
      throw new InvalidInputError(
        `Your subscription tier only supports the following chains: ${RESTRICTED_TOKEN_GATE_CHAINS.join(', ')}`
      );
    }
  }

  return true;
}

// Custom domain access tiers
const CUSTOM_DOMAIN_TIERS: SpaceSubscriptionTier[] = ['silver', 'gold', 'grant'];

// API access tiers
const API_ACCESS_TIERS: SpaceSubscriptionTier[] = ['gold', 'grant'];

// Guest access tiers
const GUEST_ACCESS_TIERS: SpaceSubscriptionTier[] = ['bronze', 'silver', 'gold', 'grant'];

// Primary member identity tiers
const PRIMARY_MEMBER_IDENTITY_TIERS: SpaceSubscriptionTier[] = ['gold', 'grant'];

export function getApiAccessStringifiedTiers() {
  return `${API_ACCESS_TIERS.slice(0, -1)
    .map((tier) => capitalize(tier))
    .join(', ')} or ${capitalize(API_ACCESS_TIERS.at(-1))}`;
}

export function hasCustomDomainAccess(subscriptionTier?: SpaceSubscriptionTier | null): boolean {
  return subscriptionTier ? CUSTOM_DOMAIN_TIERS.includes(subscriptionTier) : false;
}

export function hasApiAccess(subscriptionTier?: SpaceSubscriptionTier | null): boolean {
  return subscriptionTier ? API_ACCESS_TIERS.includes(subscriptionTier) : false;
}

export function hasGuestAccess(subscriptionTier?: SpaceSubscriptionTier | null): boolean {
  return subscriptionTier ? GUEST_ACCESS_TIERS.includes(subscriptionTier) : false;
}

export function hasPrimaryMemberIdentityAccess(subscriptionTier?: SpaceSubscriptionTier | null): boolean {
  return subscriptionTier ? PRIMARY_MEMBER_IDENTITY_TIERS.includes(subscriptionTier) : false;
}

const WORKFLOW_LIMITS: Record<SpaceSubscriptionTier, number> = {
  readonly: 0,
  free: 1,
  bronze: 2,
  silver: 3,
  gold: 5,
  grant: Infinity
} as const;

export function getWorkflowLimits(subscriptionTier?: SpaceSubscriptionTier | null) {
  return subscriptionTier ? WORKFLOW_LIMITS[subscriptionTier] : WORKFLOW_LIMITS.readonly;
}

// Block quota limits per tier (in thousands)
const BLOCK_QUOTA_LIMITS: Record<SpaceSubscriptionTier, number> = {
  readonly: 0,
  free: Infinity,
  bronze: 5,
  silver: 10,
  gold: 100,
  grant: Infinity
} as const;

export const BLOCK_QUOTA_LIMITS_LABELS: Record<SpaceSubscriptionTier, string> = {
  readonly: '0K',
  free: `Unlimited`,
  bronze: '5K',
  silver: '10K',
  gold: '100K',
  grant: 'Unlimited'
};

export function getBlockQuotaLimit(subscriptionTier?: SpaceSubscriptionTier | null) {
  const blockQuotaLimit = subscriptionTier ? BLOCK_QUOTA_LIMITS[subscriptionTier] : BLOCK_QUOTA_LIMITS.readonly;
  return blockQuotaLimit === Infinity ? Infinity : blockQuotaLimit * 1000;
}

export function hasExceededBlockQuota(subscriptionTier: SpaceSubscriptionTier | null, currentBlockCount: number) {
  const totalQuota = getBlockQuotaLimit(subscriptionTier);
  return currentBlockCount > totalQuota;
}
