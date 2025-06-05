import type { Space } from '@charmverse/core/prisma';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/Close';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TableCell from '@mui/material/TableCell';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { humanizeConditions, humanizeConditionsData } from '@packages/lib/tokenGates/humanizeConditions';
import type { TokenGateWithRoles } from '@packages/lib/tokenGates/interfaces';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useDeleteTokenGate, useUpdateTokenGateRoles } from 'charmClient/hooks/tokenGates';
import ButtonChip from 'components/common/ButtonChip';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import TableRow from 'components/common/Table/TableRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useTokenGateAccess } from 'hooks/useTokenGateAccess';

import TokenGateRolesSelect from './TokenGateRolesSelect';

type Props = {
  isAdmin: boolean;
  account?: string | null;
  tokenGate: TokenGateWithRoles;
  spaceId?: string;
  refreshTokenGates: () => Promise<void>;
  testConnect: (tokenGate: TokenGateWithRoles) => void;
};

export function TokenGateTableRow({ isAdmin, tokenGate, account, spaceId, testConnect, refreshTokenGates }: Props) {
  const deletePopupState = usePopupState({ variant: 'popover', popupId: 'token-gate-delete' });
  const { trigger: deleteTokenGate, isMutating: isLoadingDeleteTokenGate } = useDeleteTokenGate(tokenGate.id);
  const { trigger: updateTokenGates, isMutating: isLoadingUpdateTokenGates } = useUpdateTokenGateRoles(tokenGate.id);
  const { space } = useCurrentSpace();
  const { hasReachedLimit } = useTokenGateAccess({ space: space as Space });
  const { showMessage } = useSnackbar();
  const createDescription = () => {
    const conditionsData = humanizeConditionsData(tokenGate.conditions);

    return humanizeConditions(conditionsData, tokenGate.conditions.operator);
  };

  async function updateTokenGateRoles(roleIds: string[]) {
    if (spaceId) {
      await updateTokenGates({ tokenGateId: tokenGate.id, spaceId, roleIds });
      await refreshTokenGates();
    }
  }

  async function deleteRoleFromTokenGate(roleId: string) {
    if (spaceId) {
      const roleIds = tokenGate.tokenGateToRoles
        .map((tokenGateToRole) => tokenGateToRole.role.id)
        .filter((tokenGateRoleId) => tokenGateRoleId !== roleId);
      await updateTokenGates({ tokenGateId: tokenGate.id, spaceId, roleIds });
      await refreshTokenGates();
    }
  }

  const description = createDescription();

  const isLoading = isLoadingUpdateTokenGates || isLoadingDeleteTokenGate;

  const toggleTokenGateArchive = useCallback(async () => {
    try {
      if (tokenGate.archived) {
        await charmClient.tokenGates.unarchiveTokenGate(tokenGate.id);
      } else {
        await charmClient.tokenGates.archiveTokenGate(tokenGate.id);
      }
      await refreshTokenGates();
    } catch (error) {
      showMessage(
        (error as Error).message || `Failed to ${tokenGate.archived ? 'unarchive' : 'archive'} token gate`,
        'error'
      );
    }
  }, [tokenGate.archived, refreshTokenGates, showMessage, tokenGate.id]);

  return (
    <>
      <TableRow sx={{ '&:not(:last-child) td': { border: 0 }, marginBottom: 20 }}>
        <TableCell>
          <Typography variant='body2' my={1} sx={{ color: tokenGate.archived ? 'text.disabled' : 'inherit' }}>
            {description}
          </Typography>
        </TableCell>
        <TableCell>
          {tokenGate.archived ? null : (
            <TokenGateRolesSelect
              disabled={isLoading}
              isAdmin={isAdmin}
              selectedRoleIds={tokenGate.tokenGateToRoles.map(({ role }) => role.id)}
              onChange={(roleIds) => {
                updateTokenGateRoles([...roleIds]);
              }}
              onDelete={(roleId) => {
                deleteRoleFromTokenGate(roleId);
              }}
            />
          )}
        </TableCell>
        <TableCell align='center'>
          {tokenGate.archived ? null : (
            <Tooltip
              arrow
              placement='top'
              title={account ? 'Connect your wallet to test' : 'Test this gate using your own wallet'}
            >
              <Box component='span'>
                <Chip
                  onClick={() => !tokenGate.archived && testConnect(tokenGate)}
                  sx={{ width: 90 }}
                  clickable={!!account && !isLoading && !tokenGate.archived}
                  color='secondary'
                  size='small'
                  variant='outlined'
                  disabled={isLoading || !!tokenGate.archived}
                  label='Test'
                />
              </Box>
            </Tooltip>
          )}
        </TableCell>
        <TableCell width={30}>
          {isAdmin && (
            <Box display='flex' gap={1}>
              {(tokenGate.archived ? !hasReachedLimit : true) && (
                <Tooltip arrow placement='top' title={tokenGate.archived ? 'Unarchive' : 'Archive'}>
                  <ButtonChip
                    className='row-actions'
                    icon={tokenGate.archived ? <UnarchiveOutlinedIcon /> : <ArchiveOutlinedIcon />}
                    clickable
                    color='secondary'
                    size='small'
                    variant='outlined'
                    disabled={isLoading}
                    onClick={toggleTokenGateArchive}
                  />
                </Tooltip>
              )}
              <Tooltip arrow placement='top' title='Delete'>
                <ButtonChip
                  className='row-actions'
                  icon={<DeleteOutlinedIcon />}
                  clickable
                  color='secondary'
                  size='small'
                  variant='outlined'
                  disabled={isLoading}
                  onClick={deletePopupState.open}
                />
              </Tooltip>
            </Box>
          )}
        </TableCell>
      </TableRow>
      {deletePopupState.isOpen && (
        <ConfirmDeleteModal
          title='Delete token gate'
          onClose={deletePopupState.close}
          open={deletePopupState.isOpen}
          buttonText='Delete token gate'
          question='Are you sure you want to delete this invite link?'
          disabled={isLoadingDeleteTokenGate}
          onConfirm={async () => {
            await deleteTokenGate();
            await refreshTokenGates();
          }}
        />
      )}
    </>
  );
}
