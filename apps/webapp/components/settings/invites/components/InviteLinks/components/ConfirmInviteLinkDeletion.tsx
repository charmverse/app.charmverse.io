import { stringUtils } from '@charmverse/core/utilities';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';
import type { InviteLinkWithRoles } from '@packages/lib/invites/getSpaceInviteLinks';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  invite: InviteLinkWithRoles;
};

export function ConfirmInviteLinkDeletion({ onClose, open, onConfirm, invite }: Props) {
  const { deleteInviteLink } = useSpaceInvitesList();

  const questionPrefix = invite.visibleOn ? `The public invite link for ${invite.visibleOn}` : 'This private link';

  return (
    <ConfirmDeleteModal
      title='Confirm deletion'
      question={`${questionPrefix} has ${invite.roleIds.length} ${stringUtils.conditionalPlural({
        word: 'role',
        count: invite.roleIds.length ?? 0
      })} attached. Are you sure you want to delete it?`}
      open={open}
      onClose={onClose}
      onConfirm={() => {
        deleteInviteLink(invite.id as string);
        onConfirm?.();
      }}
      buttonText='Delete invite'
    />
  );
}
