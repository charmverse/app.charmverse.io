import { Bounty } from '@prisma/client';
import Modal from 'components/common/Modal';
import { PopulatedBounty } from 'charmClient';
import BountyEditorForm, { FormMode } from './BountyEditorForm';

interface Props {
  open: boolean;
  mode?: FormMode;
  bounty?: Partial<Bounty>;
  onClose: () => void;
  onSubmit: (bounty: PopulatedBounty) => void;
}

const modalTitles: Record<FormMode, string> = {
  create: 'Create a Bounty',
  update: 'Edit a Bounty'
};

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit, mode = 'create', bounty } = props;
  return (
    <Modal size='large' title={modalTitles[mode]} open={open} onClose={onClose} sx={{ margin: 'auto', maxHeight: '80vh' }}>
      {open && <BountyEditorForm onSubmit={onSubmit} bounty={bounty} mode={mode} />}
    </Modal>
  );
}
