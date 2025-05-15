import type { SpaceDefaultPublicPageToggle } from '@charmverse/core/permissions';
import type { Space, Prisma, RewardsGithubRepo } from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';
import type { UpgradeSubscriptionTierRequest } from '@packages/lib/subscription/upgradeSubscriptionTier';
import type { CreateSpaceContributionRequest } from '@packages/spaces/createSpaceContribution';
import type { SpaceReceipt } from '@packages/spaces/getSpaceReceipts';

import type { CreateSpaceProps } from 'lib/spaces/createSpace';
import type { CustomDomainVerification } from 'lib/spaces/interfaces';
import type { SpaceRequireProposalTemplateToggle } from 'lib/spaces/toggleRequireProposalTemplate';
import type { SpacePublicProposalToggle } from 'lib/spaces/toggleSpacePublicProposals';
import type { SpacePublicProposalTemplatesToggle } from 'lib/spaces/toggleSpacePublicProposalTemplates';
import type { ZippedDataRequest } from 'pages/api/spaces/[id]/export-data';
import type { UpdateGithubRepoWithReward } from 'pages/api/spaces/[id]/github/repo/[repoId]';
import type { SetSpaceWebhookBody, SetSpaceWebhookResponse } from 'pages/api/spaces/[id]/set-webhook';
import type { Response as CheckDomainResponse } from 'pages/api/spaces/checkDomain';

export class SpacesApi {
  getSpace(spaceId: string) {
    return http.GET<Space>(`/api/spaces/${spaceId}`);
  }

  searchByName(search: string) {
    return http.GET<Space[]>('/api/spaces/search-name', { search });
  }

  setPublicProposals({ publicProposals, spaceId }: SpacePublicProposalToggle): Promise<Space> {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-public-proposals`, {
      publicProposals
    });
  }

  setPublicProposalTemplates({ publicProposalTemplates, spaceId }: SpacePublicProposalTemplatesToggle): Promise<Space> {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-public-proposal-templates`, {
      publicProposalTemplates
    });
  }

  createSpace(spaceOptions: Pick<CreateSpaceProps, 'spaceTemplate' | 'spaceData'>) {
    return http.POST<Space>('/api/spaces', spaceOptions);
  }

  deleteSpace(spaceId: string) {
    return http.DELETE(`/api/spaces/${spaceId}`);
  }

  updateSpace(spaceOpts: Prisma.SpaceUpdateInput) {
    return http.PUT<Space>(`/api/spaces/${spaceOpts.id}`, spaceOpts);
  }

  updateSpaceWebhook(spaceId: string, webhookOpts: SetSpaceWebhookBody) {
    return http.PUT<SetSpaceWebhookResponse>(`/api/spaces/${spaceId}/set-webhook`, webhookOpts);
  }

  leaveSpace(spaceId: string) {
    return http.POST(`/api/spaces/${spaceId}/leave`);
  }

  getSpaces() {
    return http.GET<Space[]>('/api/spaces');
  }

  getSpaceWebhook(spaceId: string) {
    return http.GET<SetSpaceWebhookResponse>(`/api/spaces/${spaceId}/webhook`);
  }

  checkDomain(params: { spaceId?: string; domain: string }) {
    return http.GET<CheckDomainResponse>('/api/spaces/checkDomain', params);
  }

  updateSnapshotConnection(spaceId: string, data: Pick<Space, 'snapshotDomain'>): Promise<Space> {
    return http.PUT(`/api/spaces/${spaceId}/snapshot`, data);
  }

  setDefaultPublicPages({ spaceId, defaultPublicPages }: SpaceDefaultPublicPageToggle) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-default-public-pages`, {
      defaultPublicPages
    });
  }

  setRequireProposalTemplate({ spaceId, requireProposalTemplate }: SpaceRequireProposalTemplateToggle) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-require-proposal-template`, {
      requireProposalTemplate
    });
  }

  completeOnboarding({ spaceId }: { spaceId: string }) {
    return http.PUT(`/api/spaces/${spaceId}/onboarding`);
  }

  getBlockCount({ spaceId }: { spaceId: string }) {
    return http.GET<{
      count: number;
      additionalQuota: number;
    }>(`/api/spaces/${spaceId}/block-count`);
  }

  verifyCustomDomain(spaceId: string) {
    return http.GET<CustomDomainVerification>(`/api/spaces/${spaceId}/custom-domain`);
  }

  getCollablandCode(spaceId: string) {
    return http.GET<{ code: string }>(`/api/spaces/${spaceId}/collabland/code`);
  }

  exportSpaceData({ spaceId, data }: { spaceId: string; data: ZippedDataRequest }) {
    return http.POST(`/api/spaces/${spaceId}/export-data`, data);
  }

  connectWithGithubApplication({ spaceId, installationId }: { spaceId: string; installationId: string }) {
    return http.POST(`/api/spaces/${spaceId}/github/connect`, { installationId });
  }

  updateGithubRewardsRepo({
    spaceId,
    repoId,
    payload
  }: {
    spaceId: string;
    repoId: string;
    payload: UpdateGithubRepoWithReward;
  }) {
    return http.PUT<RewardsGithubRepo>(`/api/spaces/${spaceId}/github/repo/${repoId}`, payload);
  }

  createSpaceContribution(spaceId: string, payload: CreateSpaceContributionRequest) {
    return http.POST(`/api/spaces/${spaceId}/space-contribution`, payload);
  }

  getSpaceContributions(spaceId: string) {
    return http.GET<SpaceReceipt[]>(`/api/spaces/${spaceId}/space-contribution`);
  }

  getSpaceTokenBalance(spaceId: string) {
    return http.GET<number>(`/api/spaces/${spaceId}/space-token-balance`);
  }

  upgradeSubscriptionTier(spaceId: string, payload: UpgradeSubscriptionTierRequest) {
    return http.POST<void>(`/api/spaces/${spaceId}/upgrade-tier`, payload);
  }

  cancelSubscriptionTier(spaceId: string) {
    return http.POST<void>(`/api/spaces/${spaceId}/cancel-tier`);
  }
}
