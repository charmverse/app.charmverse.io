import type { ProposalCategoryPermissionLevel } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

import { ReadonlyPagePermissionRow } from './ReadonlyPagePermissionRow';

type Props = {
  proposalId: string;
};

const userFriendlyProposalPagePermissionLabels: Record<ProposalCategoryPermissionLevel, string> = {
  full_access: 'View, comment & vote',
  create_comment: 'View & comment',
  view_comment_vote: 'View, comment & vote',
  view_comment: 'View & comment',
  view: 'View'
};

export function ProposalPagePermissions({ proposalId }: Props) {
  const { data: proposal } = useGetProposalDetails(proposalId);

  const { space } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();

  const { data: proposalPermissions } = useSWR(
    !proposal || isFreeSpace ? null : `/proposals/permissions/${proposalId}`,
    () => charmClient.permissions.proposals.computeProposalPermissions({ proposalIdOrPath: proposalId })
  );

  const defaultPermissionLabel = isFreeSpace
    ? userFriendlyProposalPagePermissionLabels.view_comment_vote
    : // When using public proposals, this also provides view permission to space members if no permission exists
    space?.publicProposals
    ? userFriendlyProposalPagePermissionLabels.view
    : 'No access';

  // Only wait for permissions if this is a paid space
  if (!proposalPermissions && !isFreeSpace) {
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
