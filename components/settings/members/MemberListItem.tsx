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
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

export const StyledRow = styled(Box)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const roleActions = ['makeAdmin', 'makeMember', 'removeFromSpace'] as const;
export type RoleAction = (typeof roleActions)[number];

interface Props {
  member: Member;
  editable?: boolean;
  isSpaceOwner?: boolean;
  onChange: (action: RoleAction, member: Member) => void;
}

export function MemberListItem({ editable, isSpaceOwner, member, onChange }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });
  const { members } = useMembers();
  const { formatDate } = useDateFormatter();
  const totalAdmins = members.filter((_member) => _member.isAdmin).length;
  function handleMenuItemClick(action: RoleAction) {
    onChange(action, member);
    popupState.close();
  }
  const actions = member.isGuest
    ? roleActions.filter((action) => action === 'removeFromSpace')
    : roleActions.filter((action) => {
        switch (action) {
          case 'makeAdmin':
            return editable;
          case 'makeMember':
            return editable;
          case 'removeFromSpace': {
            return editable && !isSpaceOwner;
          }
          default:
            return false;
        }
      });

  const activeRoleAction = member.isAdmin ? 'makeAdmin' : 'makeMember';

  return (
    <TableRow data-test={`member-list-item-${member.id}`}>
      <TableCell>
        <Box display='flex' alignItems='center'>
          <Avatar name={member.username} avatar={member?.avatar} isNft={member?.hasNftAvatar} />
          <Box pl={2}>
            <Typography variant='body1'>
              <strong>{member.username}</strong>
            </Typography>
          </Box>
          <Box pl={2}></Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography minWidth={80} variant='body2'>
          {formatDate(member.createdAt)}
        </Typography>
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
              data-test={`editable-member-level-${member.id}`}
            >
              {member.isAdmin ? 'admin' : member.isGuest ? 'guest' : 'member'}
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
                      secondary='Can access all settings and invite new members to the space'
                    />
                  )}
                  {action === 'makeMember' && (
                    <StyledListItemText
                      primary='Member'
                      secondary='Cannot change space settings or invite new members to the space'
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
        ) : (
          <Typography color='secondary'>{member.isAdmin ? 'admin' : member.isGuest ? 'guest' : 'member'}</Typography>
        )}
      </TableCell>
    </TableRow>
  );
}
