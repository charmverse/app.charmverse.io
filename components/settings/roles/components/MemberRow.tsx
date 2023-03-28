import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import { Box, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import Avatar from 'components/common/Avatar';
import ElementDeleteIcon from 'components/common/form/ElementDeleteIcon';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

const roleActions = ['makeAdmin', 'makeMember', 'makeGuest', 'removeFromSpace'] as const;
export type RoleAction = (typeof roleActions)[number];

export const StyledRow = styled(Box)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    .row-actions {
      opacity: 0;
    }
    &:hover {
      .row-actions {
        opacity: 1;
      }
    }
  }
`;

interface Props {
  member: Member;
  readOnly: boolean;
  memberRoleId?: string;
}

export function MemberRow({ member, readOnly, memberRoleId }: Props) {
  return (
    <StyledRow py={2} data-test={`member-row-${member.id}`}>
      <Box display='flex' alignItems='center'>
        <Avatar name={member.username} avatar={member?.avatar} size='small' isNft={hasNftAvatar(member)} />
        <Box pl={2}>
          <Typography variant='body1'>{member.username}</Typography>
        </Box>
      </Box>
      {!readOnly && <MemberActions member={member} memberRoleId={memberRoleId} readOnly={readOnly} />}
    </StyledRow>
  );
}

function MemberActions({
  member,
  memberRoleId,
  readOnly
}: {
  member: Member;
  memberRoleId?: string;
  readOnly: boolean;
}) {
  const space = useCurrentSpace();
  const { unassignRole } = useRoles();
  const { makeAdmin, makeGuest, makeMember, members, removeFromSpace } = useMembers();
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });
  const deletePopupState = usePopupState({ variant: 'popover', popupId: 'member-list' });
  const [removedMemberId, setRemovedMemberId] = useState<string | null>(null);

  const removedMember = removedMemberId ? members.find((m) => m.id === removedMemberId) : null;
  const closed = deletePopupState.close;

  deletePopupState.close = () => {
    setRemovedMemberId(null);
    closed();
  };

  const spaceOwner = space?.createdBy;
  const totalAdmins = members.filter((m) => m.isAdmin).length;

  function removeFromSpaceHandler() {
    if (!removedMember) {
      return;
    }

    removeFromSpace(removedMember.id);
    deletePopupState.close();
  }

  async function handleMenuItemClick(action: RoleAction) {
    if (!space) {
      throw new Error('Space not found');
    }

    switch (action) {
      case 'makeAdmin':
        await makeAdmin([member.id]);
        break;

      case 'makeMember':
        await makeMember([member.id]);
        break;

      case 'makeGuest':
        await makeGuest([member.id]);
        break;

      case 'removeFromSpace':
        setRemovedMemberId(member.id);
        deletePopupState.open();
        break;

      default:
        throw new Error('Unknown action');
    }
    popupState.close();
  }
  const actions = roleActions.filter((action) => {
    switch (action) {
      case 'makeAdmin':
        return !readOnly;
      case 'makeMember':
        return !readOnly;
      case 'removeFromSpace': {
        return !readOnly && spaceOwner !== member.id;
      }
      default:
        return false;
    }
  });

  const activeRoleAction = member.isAdmin ? 'makeAdmin' : 'makeMember';

  if (memberRoleId) {
    return (
      <>
        <ElementDeleteIcon onClick={() => unassignRole(memberRoleId, member.id)} tooltip='Remove member' />
        <ConfirmDeleteModal
          title='Remove member'
          onClose={deletePopupState.close}
          open={deletePopupState.isOpen}
          buttonText={`Remove ${removedMember?.isAdmin ? 'admin' : removedMember?.isGuest ? 'guest' : 'member'}`}
          onConfirm={removeFromSpaceHandler}
          question={`Are you sure you want to remove ${removedMember?.username} from space?`}
        />
      </>
    );
  }
  return (
    <>
      <IconButton size='small' {...bindTrigger(popupState)} data-test={`editable-member-level-${member.id}`}>
        <MoreHoriz />
      </IconButton>
      <ConfirmDeleteModal
        title='Remove member'
        onClose={deletePopupState.close}
        open={deletePopupState.isOpen}
        buttonText={`Remove ${removedMember?.isAdmin ? 'admin' : removedMember?.isGuest ? 'guest' : 'member'}`}
        onConfirm={removeFromSpaceHandler}
        question={`Are you sure you want to remove ${removedMember?.username} from space?`}
      />
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
  );
}
