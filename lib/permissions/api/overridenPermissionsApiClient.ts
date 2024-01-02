import type { PagesRequest } from '@charmverse/core/pages';
import type {
  BulkPagePermissionCompute,
  PermissionCompute,
  ProposalPermissionsSwitch,
  Resource
} from '@charmverse/core/permissions';
import { PermissionsApiClient, getSpaceInfoViaResource } from '@charmverse/core/permissions';
import type { Space } from '@charmverse/core/prisma-client';

import { permissionsApiAuthKey, permissionsApiUrl } from 'config/constants';
import { isCharmVerseSpace } from 'lib/featureFlag/isCharmVerseSpace';

// Injected method for expanding args
function withUseProposalPermissionsArgs<T>(
  space: Pick<Space, 'domain'> | undefined,
  args: T
): Required<ProposalPermissionsSwitch> & T {
  const useProposalEvaluationPermissions = isCharmVerseSpace({ space });
  return { useProposalEvaluationPermissions, ...args };
}

export class PermissionsApiClientWithPermissionsSwitch extends PermissionsApiClient {
  constructor() {
    super({ authKey: permissionsApiAuthKey, baseUrl: permissionsApiUrl });

    // Override methods here

    const { pages, proposals } = this;

    // Override computePagePermissions method
    const originalComputePagePermissions = pages.computePagePermissions;

    pages.computePagePermissions = async function (args: PermissionCompute) {
      const space = await getSpaceInfoViaResource({ resourceId: args.resourceId, resourceIdType: 'page' });

      const injectedArgs = withUseProposalPermissionsArgs(space, args);

      const permissions = await originalComputePagePermissions.apply(this, [injectedArgs]);
      return permissions;
    };
    // Override bulkPagePermissions method
    const originalBulkComputePagePermissions = pages.bulkComputePagePermissions;

    pages.bulkComputePagePermissions = async function (args: BulkPagePermissionCompute) {
      const space = await getSpaceInfoViaResource({ resourceId: args.pageIds[0], resourceIdType: 'page' });

      const injectedArgs = withUseProposalPermissionsArgs(space, args);

      const permissions = await originalBulkComputePagePermissions.apply(this, [injectedArgs]);
      return permissions;
    };

    // Override getReviewerPool method
    const originalGetProposalReviewerPool = proposals.getProposalReviewerPool;

    proposals.getProposalReviewerPool = async function (args: Resource) {
      const space = await getSpaceInfoViaResource({ resourceId: args.resourceId, resourceIdType: 'proposalCategory' });

      const injectedArgs = withUseProposalPermissionsArgs(space, args);

      const reviewerPool = await originalGetProposalReviewerPool.apply(this, [injectedArgs]);
      return reviewerPool;
    };

    // Override getAccessiblePageIds method
    const originalGetAccessiblePageIds = pages.getAccessiblePageIds;

    pages.getAccessiblePageIds = async function (args: PagesRequest) {
      const space = await getSpaceInfoViaResource({ resourceId: args.spaceId, resourceIdType: 'space' });

      const injectedArgs = withUseProposalPermissionsArgs(space, args);

      const pageIds = await originalGetAccessiblePageIds.apply(this, [injectedArgs]);
      return pageIds;
    };

    // Override computeProposalPermissions method
    const originalComputeProposalPermissions = proposals.computeProposalPermissions;

    proposals.computeProposalPermissions = async function (args: PermissionCompute) {
      const space = await getSpaceInfoViaResource({ resourceId: args.resourceId, resourceIdType: 'proposal' });

      const injectedArgs = withUseProposalPermissionsArgs(space, args);

      const permissions = await originalComputeProposalPermissions.apply(this, [injectedArgs]);
      return permissions;
    };

    // Override getAccessibleProposalIds method
    const originalGetAccessibleProposalIds = proposals.getAccessibleProposalIds;

    proposals.getAccessibleProposalIds = async function (args: PagesRequest) {
      const space = await getSpaceInfoViaResource({ resourceId: args.spaceId, resourceIdType: 'space' });

      const injectedArgs = withUseProposalPermissionsArgs(space, args);

      const pageIds = await originalGetAccessibleProposalIds.apply(this, [injectedArgs]);
      return pageIds;
    };
  }
}
