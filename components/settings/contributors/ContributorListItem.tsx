
import styled from '@emotion/styled';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, TableCell, TableRow, Typography } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { Contributor } from 'models';

export const StyledRow = styled(Box)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const roleActions = ['makeAdmin', 'makeContributor', 'removeFromSpace'] as const;
export type RoleAction = typeof roleActions[number];

interface Props {
  contributor: Contributor;
  isAdmin?: boolean;
  isSpaceOwner?: boolean;
  onChange: (action: RoleAction, contributor: Contributor) => void;
}

export default function ContributorRow ({ isAdmin, isSpaceOwner, contributor, onChange }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });

  function handleMenuItemClick (action: RoleAction) {
    onChange(action, contributor);
    popupState.close();
  }

  const actions = roleActions.filter(action => {
    switch (action) {
      case 'makeAdmin':
        return isAdmin;
      case 'makeContributor':
        return isAdmin;
      case 'removeFromSpace': {
        return isAdmin && !isSpaceOwner;
      }
      default:
        return false;
    }
  });

  const activeRoleAction = contributor.isAdmin ? 'makeAdmin' : 'makeContributor';

  return (
    <TableRow>
      <TableCell>
        <Box display='flex' alignItems='center'>
          <Avatar name={contributor.username} avatar={contributor?.avatar} isNft={contributor?.hasNftAvatar} />
          <Box pl={2}>
            <Typography variant='body1'><strong>{contributor.username}</strong></Typography>
          </Box>
          <Box pl={2}>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant='body2'>{humanFriendlyDate(contributor.createdAt)}</Typography>
      </TableCell>
      <TableCell>
        {actions.length > 0 ? (
          <>
            <Button
              color='secondary'
              size='small'
              variant='outlined'
              {...bindTrigger(popupState)}
              endIcon={<KeyboardArrowDownIcon fontSize='small' />}
            >
              {contributor.isAdmin ? 'admin' : 'contributor'}
            </Button>
            <Menu
              {...bindMenu(popupState)}
              PaperProps={{
                sx: { width: 300 }
              }}
            >
              {actions.map((action) => (
                <MenuItem
                  key={action}
                  onClick={() => handleMenuItemClick(action)}
                >
                  {action === 'makeAdmin' && (
                    <StyledListItemText
                      primary='Admin'
                      secondary='Can access all settings and invite new members to the workspace'
                    />
                  )}
                  {action === 'makeContributor' && (
                    <StyledListItemText
                      primary='Contributor'
                      secondary='Cannot change workspace settings or invite new members to the workspace'
                    />
                  )}
                  {action === 'removeFromSpace' && (
                    <StyledListItemText
                      primaryTypographyProps={{ fontWeight: 500, color: 'error' }}
                      primary='Remove from team'
                    />
                  )}
                  {action === activeRoleAction && (
                    <ListItemIcon>
                      <CheckIcon fontSize='small' />
                    </ListItemIcon>
                  )}
                </MenuItem>
              ))}
            </Menu>
          </>
        )
          : (
            <Typography color='secondary'>
              {contributor.isAdmin ? 'admin' : 'contributor'}
            </Typography>
          )}
      </TableCell>
    </TableRow>
  );
}
