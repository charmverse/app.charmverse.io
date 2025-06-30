import type { PageType } from '@charmverse/core/prisma';
import type { AssignedPagePermission } from '@packages/core/permissions';
import { getCurrentEvaluation } from '@packages/core/proposals';
import { capitalize } from '@packages/utils/strings';

import charmClient from 'charmClient';
import { useCreatePermissions, useDeletePermissions } from 'charmClient/hooks/permissions';
import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePage } from 'hooks/usePage';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import ShareToWeb from '../common/ShareToWeb';

import { PermissionInheritedFrom } from './PermissionInheritedFrom';

interface Props {
  pageId: string;
  pagePermissions: AssignedPagePermission[];
  refreshPermissions: () => void;
}

const alerts: Partial<Record<PageType, string>> = {
  board: "Updates to this board's permissions, including whether it is public, will also apply to its cards.",
  card_template: 'This card template inherits permissions from its parent board.'
};

export default function PaidShareToWeb({ pageId, pagePermissions, refreshPermissions }: Props) {
  const { space } = useCurrentSpace();
  const publicPermission = pagePermissions.find((publicPerm) => publicPerm.assignee.group === 'public') ?? null;

  const { permissions: currentPagePermissions } = usePagePermissions({ pageIdOrPath: pageId });
  const { page: currentPage } = usePage({ pageIdOrPath: pageId });

  const { getFeatureTitle } = useSpaceFeatures();

  const proposalsLabel = getFeatureTitle('proposals');

  const { data: proposal } = useGetProposalDetails(currentPage?.proposalId);
  const { trigger: deletePermission, isMutating: isDeletingPermissions } = useDeletePermissions();
  const { trigger: createPermission, isMutating: isCreatingPermission } = useCreatePermissions();

  async function togglePublic() {
    if (publicPermission) {
      await deletePermission({ permissionId: publicPermission.id });
    } else {
      await createPermission({
        pageId,
        permission: {
          permissionLevel: 'view',
          assignee: {
            group: 'public'
          }
        }
      });
    }
    refreshPermissions();
  }

  const isDiscoveryChecked = !!publicPermission?.allowDiscovery;

  async function handleDiscovery() {
    if (publicPermission) {
      await charmClient.permissions.pages.updatePagePermissionDiscoverability({
        permissionId: publicPermission.id,
        allowDiscovery: !isDiscoveryChecked
      });
      refreshPermissions();
    }
  }
  const publishProposalInfoLabel = `${capitalize(
    proposalsLabel
  )} publishing is controlled by the permissions of the current workflow step.`;

  const disabledToolip =
    currentPage?.type === 'proposal'
      ? publishProposalInfoLabel
      : currentPagePermissions?.grant_permissions !== true
        ? 'You cannot update permissions for this page'
        : null;

  const isShareChecked =
    // If not using space wide proposals, go by the page permissions
    (currentPage?.type !== 'proposal' && !!publicPermission) || !!proposal?.isPublic;

  const baseShareAlertMessage = currentPage ? (alerts[currentPage.type] ?? '') : '';

  const shareAlertMessage = (
    currentPage?.type === 'proposal'
      ? `${publishProposalInfoLabel ?? ''}\r\n\r\n${baseShareAlertMessage}`
      : baseShareAlertMessage
  )?.trim();

  return (
    <>
      <ShareToWeb
        shareChecked={isShareChecked}
        discoveryChecked={isDiscoveryChecked}
        pageId={pageId}
        handlePublish={togglePublic}
        handleDiscovery={handleDiscovery}
        disabled={isDeletingPermissions || isCreatingPermission || !!disabledToolip}
        disabledTooltip={disabledToolip}
        isLoading={isDeletingPermissions || isCreatingPermission}
        shareAlertMessage={shareAlertMessage}
        pageType={currentPage?.type}
      />
      {isShareChecked && publicPermission && currentPage?.type !== 'proposal' && (
        <PermissionInheritedFrom permission={publicPermission} />
      )}
    </>
  );
}
