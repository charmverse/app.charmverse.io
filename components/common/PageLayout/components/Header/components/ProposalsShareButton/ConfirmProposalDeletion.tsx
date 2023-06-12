import { stringUtils } from '@charmverse/core/utilities';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmPublicProposalLinkDeletion({ onClose, open, onConfirm }: Props) {
  const { publicInvites, deleteInviteLink } = useSpaceInvitesList();

  const publicProposalInvite = publicInvites.find((invite) => invite.publicContext === 'proposals');

  return (
    <ConfirmDeleteModal
      title='Confirm delete'
      question={`This invite link has ${publicProposalInvite?.roleIds.length} ${stringUtils.conditionalPlural({
        word: 'role',
        count: publicProposalInvite?.roleIds.length ?? 0
      })} attached. Are you sure you want to delete it?`}
      open={open}
      onClose={onClose}
      onConfirm={() => {
        deleteInviteLink(publicProposalInvite?.id as string);
        onConfirm();
      }}
      buttonText='Delete invite'
    />
  );
}
