import type { ProposalCategoryPermissionLevel } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import useSWR from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useProposal } from 'hooks/useProposal';

import { ReadonlyPagePermissionRow } from './ReadonlyPagePermissionRow';

type Props = {
  proposalId: string;
};

const userFriendlyPermissionLabels: Record<ProposalCategoryPermissionLevel, string> = {
  full_access: 'View, comment & vote',
  view_comment_vote: 'View, comment & vote',
  view_comment: 'View & comment',
  view: 'View'
};

export function ProposalPagePermissions({ proposalId }: Props) {
  const { proposal } = useProposal({ proposalId });

  const { space } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();

  const { data: proposalCategoryPermissions } = useSWR(
    !proposal || isFreeSpace ? null : `/proposals/list-proposal-category-permissions-${proposal.categoryId}`,
    () => charmClient.permissions.proposals.listProposalCategoryPermissions(proposal!.categoryId as string)
  );

  const spaceLevelPermission = proposalCategoryPermissions?.find((permission) => permission.assignee.group === 'space');

  const defaultPermissionLabel = isFreeSpace
    ? userFriendlyPermissionLabels.view_comment_vote
    : // Resume normal flow of checks for a paid space
    spaceLevelPermission
    ? userFriendlyPermissionLabels[spaceLevelPermission.permissionLevel]
    : // When using public proposals, this also provides view permission to space members if no permission exists
    space?.publicProposals
    ? userFriendlyPermissionLabels.view
    : 'No access';

  // Only wait for permissions if this is a paid space
  if (!proposalCategoryPermissions && !isFreeSpace) {
    return (
      <Box sx={{ height: '100px' }}>
        <LoadingComponent />
      </Box>
    );
  }

  return (
    <Stack gap={1.5}>
      <ReadonlyPagePermissionRow assignee='Default permissions' value={defaultPermissionLabel} />
      <ReadonlyPagePermissionRow assignee='Authors' value='Edit proposal' />
      <ReadonlyPagePermissionRow assignee='Reviewers' value='Review & comment proposal' />
    </Stack>
  );
}
