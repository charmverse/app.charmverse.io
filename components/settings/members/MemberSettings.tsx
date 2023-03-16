import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import type { Space } from '@prisma/client';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

import Legend from '../Legend';

import type { RoleAction } from './MemberListItem';
import { MemberListItem } from './MemberListItem';

export default function MemberSettings({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { id: spaceId, createdBy: spaceOwner } = space;
  const popupState = usePopupState({ variant: 'popover', popupId: 'member-list' });
  const { members, mutateMembers } = useMembers();
  const [removedMemberId, setRemovedMemberId] = useState<string | null>(null);

  const removedMember = removedMemberId ? members.find((member) => member.id === removedMemberId) : null;

  const closed = popupState.close;

  popupState.close = () => {
    setRemovedMemberId(null);
    closed();
  };

  async function updateMember(action: RoleAction, member: Member) {
    switch (action) {
      case 'makeAdmin':
        await charmClient.updateMember({ spaceId, userId: member.id, isAdmin: true });
        if (members) {
          mutateMembers(
            members.map((c) => (c.id === member.id ? { ...c, isAdmin: true } : c)),
            { revalidate: false }
          );
        }
        break;

      case 'makeMember':
        await charmClient.updateMember({ spaceId, userId: member.id, isAdmin: false });
        if (members) {
          mutateMembers(
            members.map((c) => (c.id === member.id ? { ...c, isAdmin: false } : c)),
            { revalidate: false }
          );
        }
        break;

      case 'removeFromSpace':
        setRemovedMemberId(member.id);
        popupState.open();
        break;

      default:
        throw new Error('Unknown action');
    }
  }
  const menuState = bindMenu(popupState);

  async function removeMember() {
    await charmClient.removeMember({ spaceId, userId: removedMemberId as string });
    if (members) {
      mutateMembers(
        members.filter((c) => c.id !== removedMemberId),
        { revalidate: false }
      );
      setRemovedMemberId(null);
    }
  }

  return (
    <>
      <Legend>Current Members</Legend>
      <Box overflow='auto'>
        <Table size='small' aria-label='Current members table'>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Join date</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members
              ?.filter((member) => !member.isBot)
              .map((member) => (
                <MemberListItem
                  editable={isAdmin}
                  key={member.id}
                  isSpaceOwner={spaceOwner === member.id}
                  member={member}
                  onChange={updateMember}
                />
              ))}
          </TableBody>
        </Table>
      </Box>
      {removedMember && (
        <ConfirmDeleteModal
          title='Remove member'
          onClose={popupState.close}
          open={menuState.open}
          buttonText={`Remove ${removedMember.isAdmin ? 'admin' : removedMember.isGuest ? 'guest' : 'member'}`}
          onConfirm={removeMember}
          question={`Are you sure you want to remove ${removedMember.username} from space?`}
        />
      )}
    </>
  );
}
