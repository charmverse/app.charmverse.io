import type { PagesRequest } from '@charmverse/core/pages';
import type {
  BulkPagePermissionCompute,
  PermissionCompute,
  ProposalPermissionsSwitch,
  Resource
} from '@charmverse/core/permissions';
import { PermissionsApiClient } from '@charmverse/core/permissions';

import { permissionsApiAuthKey, permissionsApiUrl } from 'config/constants';

// Injected method for expanding args
function withUseProposalPermissionsArgs<T>(args: T): Required<ProposalPermissionsSwitch> & T {
  return { useProposalEvaluationPermissions: true, ...args };
}

export class PermissionsApiClientWithPermissionsSwitch extends PermissionsApiClient {
  constructor() {
    super({ authKey: permissionsApiAuthKey, baseUrl: permissionsApiUrl });

    // Override methods here

    const { pages, proposals } = this;

    // Override computePagePermissions method
    const originalComputePagePermissions = pages.computePagePermissions;

    pages.computePagePermissions = async function (args: PermissionCompute) {
      const permissions = await originalComputePagePermissions.apply(this, [withUseProposalPermissionsArgs(args)]);
      return permissions;
    };
    // Override bulkPagePermissions method
    const originalBulkComputePagePermissions = pages.bulkComputePagePermissions;

    pages.bulkComputePagePermissions = async function (args: BulkPagePermissionCompute) {
      const permissions = await originalBulkComputePagePermissions.apply(this, [withUseProposalPermissionsArgs(args)]);
      return permissions;
    };

    // Override getAccessiblePageIds method
    const originalGetAccessiblePageIds = pages.getAccessiblePageIds;

    pages.getAccessiblePageIds = async function (args: PagesRequest) {
      const pageIds = await originalGetAccessiblePageIds.apply(this, [withUseProposalPermissionsArgs(args)]);
      return pageIds;
    };

    // Override computeProposalPermissions method
    const originalComputeProposalPermissions = proposals.computeProposalPermissions;

    proposals.computeProposalPermissions = async function (args: PermissionCompute) {
      const permissions = await originalComputeProposalPermissions.apply(this, [withUseProposalPermissionsArgs(args)]);
      return permissions;
    };

    // Override getAccessibleProposalIds method
    const originalGetAccessibleProposalIds = proposals.getAccessibleProposalIds;

    proposals.getAccessibleProposalIds = async function (args: PagesRequest) {
      const pageIds = await originalGetAccessibleProposalIds.apply(this, [withUseProposalPermissionsArgs(args)]);
      return pageIds;
    };
  }
}
