import { BasicModal } from 'components/common/Modal';

import { NFTPurchase } from './NFTPurchase';

export function NFTPurchaseDialog(props: {
  onClose: VoidFunction;
  builderId?: string | null;
  user?: { username: string } | null;
}) {
  if (!props.user || !props.builderId) {
    return null;
  }
  return (
    <BasicModal open onClose={props.onClose} theme='dark'>
      <NFTPurchase builderId={props.builderId as string} user={props.user} />
    </BasicModal>
  );
}
