import type { PagesRequest } from '@charmverse/core/pages';
import type {
  BulkPagePermissionCompute,
  BulkPagePermissionFlags,
  PermissionCompute
} from '@charmverse/core/permissions';
import { PermissionsApiClient } from '@charmverse/core/permissions';

import { permissionsApiAuthKey, permissionsApiUrl } from 'config/constants';

// Injected method for expanding args
function withUseProposalPermissionsArgs<T>(args: T): T {
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
      // Large list of UUIDs will error out
      const pagination = 200;

      let permissions: BulkPagePermissionFlags = {};

      for (let i = 0; i < args.pageIds.length; i += pagination) {
        const _permissions = await originalBulkComputePagePermissions.apply(this, [
          withUseProposalPermissionsArgs({ userId: args.userId, pageIds: args.pageIds.slice(i, i + pagination) })
        ]);

        permissions = Object.assign(permissions, _permissions);
      }
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
