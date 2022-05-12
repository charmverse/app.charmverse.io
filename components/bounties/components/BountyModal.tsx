import { Bounty } from '@prisma/client';
import Modal from 'components/common/Modal';
import { PopulatedBounty } from 'charmClient';
import BountyEditorForm, { FormMode, bountyFormTitles } from './BountyEditorForm';

interface Props {
  open: boolean;
  mode?: FormMode;
  bounty?: Partial<Bounty>;
  onClose: () => void;
  onSubmit: (bounty: PopulatedBounty) => void;
}

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit, mode = 'create', bounty } = props;
  return (
    <Modal size='large' title={bountyFormTitles[mode]} open={open} onClose={onClose} sx={{ margin: 'auto' }}>
      {open && <BountyEditorForm onSubmit={onSubmit} bounty={bounty} mode={mode} />}
    </Modal>
  );
}
