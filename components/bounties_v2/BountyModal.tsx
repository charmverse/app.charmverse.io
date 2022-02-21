import { FormMode } from 'components/common/form/Form';
import { DialogTitle, Modal } from 'components/common/Modal';
import { useUser } from 'hooks/useUser';
import { Bounty } from '@prisma/client';
import { BountyEditor } from './BountyEditor';
import { BountyEditorForm } from './BountyEditorForm';

interface Props {
  open: boolean;
  modalType?: FormMode;
  bounty?: Bounty;
  onClose: () => void;
  onSubmit: (bounty: Bounty) => void;
}

const modalTitles: Record<FormMode, string> = {
  create: 'Create a Bounty',
  update: 'Edit a Bounty'
};

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit, modalType = 'create', bounty } = props;
  const [user] = useUser();

  return (
    <Modal size='large' open={open} onClose={onClose} sx={{ margin: 'auto', maxHeight: '80vh' }}>
      <DialogTitle onClose={onClose}>{modalTitles[modalType]}</DialogTitle>
      <BountyEditorForm onSubmit={onSubmit} bounty={bounty} />
    </Modal>
  );
}
