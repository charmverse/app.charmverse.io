import { BasicModal } from 'components/common/Modal';

import { NFTPurchase } from './NFTPurchase';

export function NFTPurchaseDialog(props: { onClose: VoidFunction; builderId: string }) {
  if (!props.builderId) {
    return null;
  }
  return (
    <BasicModal open onClose={props.onClose} theme='dark'>
      <NFTPurchase builderId={props.builderId} />
    </BasicModal>
  );
}
