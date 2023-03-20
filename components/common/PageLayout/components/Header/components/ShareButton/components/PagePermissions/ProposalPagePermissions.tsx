import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ProposalCategoryPermissionLevel } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';

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
  const { data: proposal } = useSWR(!proposalId ? null : `proposal/${proposalId}`, () =>
    charmClient.proposals.getProposal(proposalId)
  );
  const { data: proposalCategoryPermissions } = useSWR(
    !proposal ? null : `/proposals/list-proposal-category-permissions-${proposal!.categoryId}`,
    () => charmClient.permissions.proposals.listProposalCategoryPermissions(proposal!.categoryId as string)
  );
  const space = useCurrentSpace();
  const { roles } = useRoles();

  const spaceLevelPermission = proposalCategoryPermissions?.find((permission) => permission.assignee.group === 'space');
  const rolePermissions =
    proposalCategoryPermissions?.filter((permission) => permission.assignee.group === 'role') ?? [];
  if (!proposalCategoryPermissions) {
    return <LoadingComponent />;
  }
  return (
    <Box p={1}>
      <Box display='block' py={0.5}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2'>Authors</Typography>
          <div style={{ width: '160px', textAlign: 'right' }}>
            <Typography color='secondary' variant='caption'>
              Edit proposal
            </Typography>
          </div>
        </Box>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2'>Reviewers</Typography>
          <div style={{ width: '160px', textAlign: 'right' }}>
            <Typography color='secondary' variant='caption'>
              Review & comment proposal
            </Typography>
          </div>
        </Box>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2'>Everyone at {space?.name}</Typography>
          <div style={{ width: '160px', textAlign: 'right' }}>
            <Typography color='secondary' variant='caption'>
              {spaceLevelPermission ? userFriendlyPermissionLabels[spaceLevelPermission.permissionLevel] : 'No access'}
            </Typography>
          </div>
        </Box>
        {rolePermissions.map((perm) => (
          <Box key={perm.id} display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='body2'>
              {roles?.find((r) => r.id === (perm.assignee as TargetPermissionGroup<'role'>).id)?.name ?? ''}
            </Typography>
            <div style={{ width: '160px', textAlign: 'right' }}>
              <Typography color='secondary' variant='caption'>
                {userFriendlyPermissionLabels[perm.permissionLevel]}
              </Typography>
            </div>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
