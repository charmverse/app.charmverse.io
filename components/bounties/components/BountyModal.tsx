import { Bounty } from '@prisma/client';
import Modal from 'components/common/Modal';
import { BountyWithDetails } from 'models';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import BountyEditorForm, { FormMode, bountyFormTitles, FormValues } from './BountyEditorForm';

interface Props {
  open: boolean;
  mode?: FormMode;
  bounty?: Partial<Bounty>;
  onClose: () => void;
  onSubmit: (bounty: BountyWithDetails) => void;
  focusKey?: keyof FormValues;
  permissions?: AssignedBountyPermissions;
}

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit, mode = 'create', bounty, focusKey, permissions } = props;
  return (
    <Modal size='large' title={bountyFormTitles[mode]} open={open} onClose={onClose} sx={{ margin: 'auto' }}>
      {open && <BountyEditorForm permissions={permissions} onSubmit={onSubmit} bounty={bounty} mode={mode} focusKey={focusKey} />}
    </Modal>
  );
}
