import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

import Legend from '../Legend';

import type { RoleAction } from './MemberListItem';
import MemberListItem from './MemberListItem';

interface Props {
  isAdmin: boolean;
  spaceId: string;
  spaceOwner: string;
}

export default function MemberList ({ isAdmin, spaceId, spaceOwner }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'member-list' });
  const { members, mutateMembers } = useMembers();
  const [removedMemberId, setRemovedMemberId] = useState<string | null>(null);

  const removedMember = removedMemberId ? members.find(member => member.id === removedMemberId) : null;

  const closed = popupState.close;

  popupState.close = () => {
    setRemovedMemberId(null);
    closed();
  };

  async function updateMember (action: RoleAction, member: Member) {
    switch (action) {

      case 'makeAdmin':
        await charmClient.updateMember({ spaceId, userId: member.id, isAdmin: true });
        mutateMembers(members.map(c => c.id === member.id ? { ...c, isAdmin: true } : c), { revalidate: false });
        break;

      case 'makeMember':
        await charmClient.updateMember({ spaceId, userId: member.id, isAdmin: false });
        mutateMembers(members.map(c => c.id === member.id ? { ...c, isAdmin: false } : c), { revalidate: false });
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

  async function removeMember () {
    await charmClient.removeMember({ spaceId, userId: removedMemberId as string });
    mutateMembers(members.filter(c => c.id !== removedMemberId), { revalidate: false });
    setRemovedMemberId(null);
  }

  return (
    <>
      <Legend>Current Members</Legend>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Username</TableCell>
            <TableCell>Join date</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map(member => (
            member.isBot === true ? null : (
              <MemberListItem
                isAdmin={isAdmin}
                key={member.id}
                isSpaceOwner={spaceOwner === member.id}
                member={member}
                onChange={updateMember}
              />
            )
          ))}
        </TableBody>
      </Table>
      {removedMember && (
        <ConfirmDeleteModal
          title='Remove member'
          onClose={popupState.close}
          open={menuState.open}
          buttonText={`Remove ${removedMember.username}`}
          onConfirm={removeMember}
          question={`Are you sure you want to remove ${removedMember.username} from space?`}
        />
      )}
    </>
  );
}
