import type { AssignedPagePermission } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma';

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

  // In the case of a space with public proposals, we want to override the manual setting
  const disabledToolip =
    !!space?.publicProposals && currentPage?.type === 'proposal'
      ? `This toggle is disabled because your space uses public ${proposalsLabel}.`
      : currentPagePermissions?.grant_permissions !== true
      ? 'You cannot update permissions for this page'
      : null;

  const isShareChecked =
    // If not using space wide proposals, go by the page permissions
    (!space?.publicProposals && !!publicPermission) ||
    (!!space?.publicProposals &&
      // If space has public proposals, don't interfere with non-proposal pages
      ((currentPage?.type !== 'proposal' && !!publicPermission) ||
        // All proposals beyond draft are public
        (currentPage?.type === 'proposal' && proposal?.status !== 'draft')));

  const baseShareAlertMessage = currentPage ? alerts[currentPage.type] ?? '' : '';

  const publicProposalToggleInfo =
    space?.publicProposals && !!proposal
      ? `Your space uses public ${proposalsLabel}. ${
          proposal?.status === 'draft'
            ? 'This draft is only visible to authors and reviewers until it is published.'
            : `Published ${proposalsLabel} are publicly visible.`
        }`
      : null;

  const shareAlertMessage = (
    currentPage?.type === 'proposal' && publicProposalToggleInfo
      ? `${publicProposalToggleInfo ?? ''}\r\n\r\n${baseShareAlertMessage}`
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
      />
      {isShareChecked && publicPermission && currentPage?.type !== 'proposal' && (
        <PermissionInheritedFrom permission={publicPermission} />
      )}
    </>
  );
}
