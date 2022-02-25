import { Bounty } from '@prisma/client';
import { DialogTitle, Modal } from 'components/common/Modal';
import { BountyEditorForm, FormMode } from './BountyEditorForm';

interface Props {
  open: boolean;
  mode?: FormMode;
  bounty?: Partial<Bounty>;
  onClose: () => void;
  onSubmit: (bounty: Bounty) => void;
}

const modalTitles: Record<FormMode, string> = {
  create: 'Create a Bounty',
  update: 'Edit a Bounty'
};

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit, mode = 'create', bounty } = props;

  return (
    <Modal size='large' open={open} onClose={onClose} sx={{ margin: 'auto', maxHeight: '80vh' }}>
      <DialogTitle onClose={onClose}>{modalTitles[mode]}</DialogTitle>
      <BountyEditorForm onSubmit={onSubmit} bounty={bounty} mode={mode} />
    </Modal>
  );
}
