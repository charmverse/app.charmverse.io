import { log } from '@charmverse/core/log';
import { MoreHoriz } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import { IconButton, Menu, Tooltip, MenuItem, ListItemIcon } from '@mui/material';
import { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import ElementDeleteIcon from 'components/common/form/ElementDeleteIcon';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { StyledListItemText } from 'components/common/StyledListItemText';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Member } from '@packages/lib/members/interfaces';

const roleActions = ['makeAdmin', 'makeMember', 'makeGuest', 'removeFromSpace', 'banFromSpace'] as const;
export type RoleAction = (typeof roleActions)[number];

export function MemberActions({
  member,
  memberRoleId,
  readOnly
}: {
  member: Member;
  memberRoleId?: string;
  readOnly?: boolean;
}) {
  const { showMessage } = useSnackbar();
  const { unassignRole } = useRoles();
  const { makeAdmin, makeGuest, makeMember, members, banFromSpace, removeFromSpace, getMemberById } = useMembers();
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });
  const deletePopupState = usePopupState({ variant: 'popover', popupId: 'delete-member' });
  const banPopupState = usePopupState({ variant: 'popover', popupId: 'ban-member' });
  const [removedMemberId, setRemovedMemberId] = useState<string | null>(null);
  const [bannedMemberId, setBannedMemberId] = useState<string | null>(null);

  const removedMember = removedMemberId ? getMemberById(removedMemberId) : null;
  const bannedMember = bannedMemberId ? getMemberById(bannedMemberId) : null;
  const closed = deletePopupState.close;

  deletePopupState.close = () => {
    setRemovedMemberId(null);
    closed();
  };

  const totalAdmins = members.filter((m) => m.isAdmin).length;

  async function removeFromSpaceHandler() {
    if (!removedMember) {
      return;
    }

    try {
      await removeFromSpace(removedMember.id);
    } catch (error) {
      log.warn('Error removing member', { error });
      showMessage((error as Error).message || 'Something went wrong', 'error');
    }
    deletePopupState.close();
  }

  async function banFromSpaceHandler() {
    if (!bannedMemberId) {
      return;
    }

    try {
      await banFromSpace(bannedMemberId);
    } catch (error) {
      log.warn('Error bakking member', { error });
      showMessage((error as Error).message || 'Something went wrong', 'error');
    }
    banPopupState.close();
  }

  async function handleMenuItemClick(action: RoleAction) {
    try {
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

        case 'banFromSpace':
          setBannedMemberId(member.id);
          banPopupState.open();
          break;

        default:
          throw new Error('Unknown action');
      }
      popupState.close();
    } catch (error) {
      log.warn('Error updating member role', { error });
      showMessage((error as Error).message || 'Something went wrong', 'error');
    }
  }
  const actions = roleActions.filter((action) => {
    switch (action) {
      case 'makeAdmin':
        return !readOnly;
      case 'makeGuest':
        return !readOnly;
      case 'makeMember':
        return !readOnly;
      case 'removeFromSpace': {
        return !readOnly;
      }
      case 'banFromSpace': {
        return !readOnly;
      }
      default:
        return false;
    }
  });

  const activeRoleAction = member.isAdmin ? 'makeAdmin' : member.isGuest ? 'makeGuest' : 'makeMember';

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
        <ConfirmDeleteModal
          title='Ban member'
          onClose={banPopupState.close}
          open={banPopupState.isOpen}
          buttonText={`Ban ${bannedMember?.isAdmin ? 'admin' : bannedMember?.isGuest ? 'guest' : 'member'}`}
          onConfirm={banFromSpaceHandler}
          question={`Are you sure you want to ban ${bannedMember?.username} from space? This will ban all of the wallets and accounts from this member.`}
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
      <ConfirmDeleteModal
        title='Ban member'
        onClose={banPopupState.close}
        open={banPopupState.isOpen}
        buttonText={`Ban ${bannedMember?.isAdmin ? 'admin' : bannedMember?.isGuest ? 'guest' : 'member'}`}
        onConfirm={banFromSpaceHandler}
        question={`Are you sure you want to ban ${bannedMember?.username} from space? This will ban all of the wallets and accounts from this member.`}
      />
      <Menu
        {...bindMenu(popupState)}
        PaperProps={{
          sx: { width: 300 }
        }}
      >
        {actions.map((action) => {
          const disabled = action !== 'makeAdmin' && member.isAdmin && totalAdmins === 1;
          return (
            <Tooltip
              key={action}
              title={disabled ? 'You must add at least one more admin before removing this one' : ''}
            >
              <span>
                <MenuItem
                  onClick={() => handleMenuItemClick(action)}
                  disabled={action !== 'makeAdmin' && member.isAdmin && totalAdmins === 1}
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
                  {action === 'makeGuest' && (
                    <StyledListItemText primary='Guest' secondary='Can only access specific pages' />
                  )}
                  {action === 'removeFromSpace' && (
                    <StyledListItemText
                      primaryTypographyProps={{ fontWeight: 500, color: 'error' }}
                      primary='Remove from space'
                      secondary='Remove this member from the current space'
                    />
                  )}
                  {action === 'banFromSpace' && (
                    <StyledListItemText
                      primaryTypographyProps={{ fontWeight: 500, color: 'error' }}
                      primary='Ban from space'
                      secondary='Ban all of the wallets and accounts from this member'
                    />
                  )}
                  {action === activeRoleAction && (
                    <ListItemIcon>
                      <CheckIcon fontSize='small' />
                    </ListItemIcon>
                  )}
                </MenuItem>
              </span>
            </Tooltip>
          );
        })}
      </Menu>
    </>
  );
}
