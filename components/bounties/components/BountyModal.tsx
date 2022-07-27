import { Bounty } from '@prisma/client';
import Modal from 'components/common/Modal';
import { BountyWithDetails } from 'models';
import { AssignedBountyPermissions } from 'lib/bounties/interfaces';
import BountyEditorForm, { FormMode, bountyFormTitles, FormValues } from './BountyEditorForm';

interface Props {
  open: boolean;
  mode?: FormMode;
  bounty?: Partial<Bounty>;
  linkedPageId?: string;
  onClose: () => void;
  onSubmit: (bounty: BountyWithDetails) => void;
  focusKey?: keyof FormValues;
  permissions?: AssignedBountyPermissions;
}

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit, mode = 'create', bounty, linkedPageId, focusKey, permissions } = props;
  return (
    <Modal size='large' title={bountyFormTitles[mode]} open={open} onClose={onClose} sx={{ margin: 'auto' }}>
      {open && (
      <BountyEditorForm
        permissions={permissions}
        onSubmit={onSubmit}
        bounty={bounty}
        linkedPageId={linkedPageId}
        mode={mode}
        focusKey={focusKey}
      />
      )}
    </Modal>
  );
}
