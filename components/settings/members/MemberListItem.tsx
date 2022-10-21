
import styled from '@emotion/styled';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, TableCell, TableRow, Typography } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';
import { humanFriendlyDate } from 'lib/utilities/dates';

export const StyledRow = styled(Box)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const roleActions = ['makeAdmin', 'makeMember', 'removeFromSpace'] as const;
export type RoleAction = typeof roleActions[number];

interface Props {
  member: Member;
  isAdmin?: boolean;
  isSpaceOwner?: boolean;
  onChange: (action: RoleAction, member: Member) => void;
}

export default function MemberRow ({ isAdmin, isSpaceOwner, member, onChange }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });
  const { members } = useMembers();
  const totalAdmins = members.filter(_member => _member.isAdmin).length;
  function handleMenuItemClick (action: RoleAction) {
    onChange(action, member);
    popupState.close();
  }

  const actions = roleActions.filter(action => {
    switch (action) {
      case 'makeAdmin':
        return isAdmin;
      case 'makeMember':
        return isAdmin;
      case 'removeFromSpace': {
        return isAdmin && !isSpaceOwner;
      }
      default:
        return false;
    }
  });

  const activeRoleAction = member.isAdmin ? 'makeAdmin' : 'makeMember';

  return (
    <TableRow>
      <TableCell>
        <Box display='flex' alignItems='center'>
          <Avatar name={member.username} avatar={member?.avatar} isNft={member?.hasNftAvatar} />
          <Box pl={2}>
            <Typography variant='body1'><strong>{member.username}</strong></Typography>
          </Box>
          <Box pl={2}>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant='body2'>{humanFriendlyDate(member.createdAt)}</Typography>
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
              {member.isAdmin ? 'admin' : 'member'}
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
                  disabled={action === 'makeMember' && totalAdmins === 1}
                >
                  {action === 'makeAdmin' && (
                    <StyledListItemText
                      primary='Admin'
                      secondary='Can access all settings and invite new members to the workspace'
                    />
                  )}
                  {action === 'makeMember' && (
                    <StyledListItemText
                      primary='Member'
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
              {member.isAdmin ? 'admin' : 'member'}
            </Typography>
          )}
      </TableCell>
    </TableRow>
  );
}
