import type { SpaceDefaultPublicPageToggle } from '@charmverse/core/permissions';
import type { Space, Prisma } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type { CreateSpaceProps } from 'lib/spaces/createSpace';
import type { BlockCountInfo } from 'lib/spaces/getSpaceBlockCount';
import type { CustomDomainVerification, SpaceWithGates } from 'lib/spaces/interfaces';
import type { SpaceRequireProposalTemplateToggle } from 'lib/spaces/toggleRequireProposalTemplate';
import type { SpacePublicProposalToggle } from 'lib/spaces/toggleSpacePublicProposals';
import type { UpdateCustomDomainResponse } from 'lib/spaces/updateSpaceCustomDomain';
import type { SetSpaceWebhookBody, SetSpaceWebhookResponse } from 'pages/api/spaces/[id]/set-webhook';
import type { Response as CheckDomainResponse } from 'pages/api/spaces/checkDomain';

export class SpacesApi {
  getSpace(spaceId: string) {
    return http.GET<Space>(`/api/spaces/${spaceId}`);
  }

  searchByName(search: string) {
    return http.GET<SpaceWithGates[]>('/api/spaces/search-name', { search });
  }

  setPublicProposals({ publicProposals, spaceId }: SpacePublicProposalToggle): Promise<Space> {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-public-proposals`, {
      publicProposals
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

  updateSnapshotConnection(
    spaceId: string,
    data: Pick<Space, 'snapshotDomain' | 'defaultVotingDuration'>
  ): Promise<Space> {
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
    return http.GET<BlockCountInfo>(`/api/spaces/${spaceId}/block-count`);
  }

  updateCustomDomain({ spaceId, customDomain }: { spaceId: string; customDomain: string | null }) {
    return http.PUT<UpdateCustomDomainResponse>(`/api/spaces/${spaceId}/custom-domain`, { customDomain });
  }

  verifyCustomDomain(spaceId: string) {
    return http.GET<CustomDomainVerification>(`/api/spaces/${spaceId}/custom-domain`);
  }

  getCollablandCode(spaceId: string) {
    return http.GET<{ code: string }>(`/api/spaces/${spaceId}/collabland/code`);
  }
}
