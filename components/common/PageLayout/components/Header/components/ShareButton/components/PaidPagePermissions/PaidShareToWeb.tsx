import type { AssignedPagePermission } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePage } from 'hooks/usePage';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { useProposal } from 'hooks/useProposal';

import ShareToWeb from '../common/ShareToWeb';

import { PermissionInheritedFrom } from './PermissionInheritedFrom';

interface Props {
  pageId: string;
  pagePermissions: AssignedPagePermission[];
  refreshPermissions: () => void;
}

const alerts: Partial<Record<PageType, string>> = {
  board: "Updates to this board's permissions, including whether it is public, will also apply to its cards.",
  card_template: 'This card template inherits permissions from its parent board.',
  proposal: 'Proposal permissions are managed at the category level.'
};

export default function PaidShareToWeb({ pageId, pagePermissions, refreshPermissions }: Props) {
  const { space } = useCurrentSpace();
  const publicPermission = pagePermissions.find((publicPerm) => publicPerm.assignee.group === 'public') ?? null;

  const { permissions: currentPagePermissions } = usePagePermissions({ pageIdOrPath: pageId });
  const { page: currentPage } = usePage({ pageIdOrPath: pageId });

  const { proposal } = useProposal({ proposalId: currentPage?.proposalId });

  async function togglePublic() {
    if (publicPermission) {
      await charmClient.deletePermission({ permissionId: publicPermission.id });
    } else {
      await charmClient.createPermission({
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

  // In the case of a space with public proposals, we want to override the manual setting
  const disabledToolip =
    !!space?.publicProposals && currentPage?.type === 'proposal'
      ? 'This toggle is disabled because your space uses public proposals.'
      : currentPagePermissions?.edit_isPublic !== true
      ? 'You cannot manage permissions for this page'
      : null;

  const isChecked =
    // If not using space wide proposals, go by the page permissions
    (!space?.publicProposals && !!publicPermission) ||
    (!!space?.publicProposals &&
      // If space has public proposals, don't interfere with non-proposal pages
      ((currentPage?.type !== 'proposal' && !!publicPermission) ||
        // All proposals beyond draft are public
        (currentPage?.type === 'proposal' && proposal?.status !== 'draft')));

  let publicProposalToggleInfo = space?.publicProposals && proposal ? 'Your space uses public proposals. ' : null;
  if (space?.publicProposals && proposal?.status === 'draft') {
    publicProposalToggleInfo +=
      'This draft is only visible to authors and reviewers until it is progressed to the discussion stage.';
  } else if (space?.publicProposals && !!proposal) {
    publicProposalToggleInfo += 'Proposals in discussion stage and beyond are publicly visible.';
  }

  const baseShareAlertMessage = currentPage ? alerts[currentPage.type] : null;

  const shareAlertMessage =
    currentPage?.type === 'proposal' ? baseShareAlertMessage + (publicProposalToggleInfo ?? '') : baseShareAlertMessage;

  return (
    <>
      <ShareToWeb
        toggleChecked={isChecked}
        pageId={pageId}
        onChange={togglePublic}
        disabled={!!disabledToolip}
        disabledTooltip={disabledToolip}
        shareAlertMessage={shareAlertMessage}
      />

      {isChecked && publicPermission && <PermissionInheritedFrom permission={publicPermission} />}
    </>
  );
}
