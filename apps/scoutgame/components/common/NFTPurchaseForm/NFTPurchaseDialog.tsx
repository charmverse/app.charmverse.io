'use client';

import { BasicModal } from 'components/common/Modal';

import { NFTPurchase } from './NFTPurchaseForm';

export function NFTPurchaseDialog(props: { open: boolean; onClose: VoidFunction; builderId: string }) {
  return (
    <BasicModal open={props.open} onClose={props.onClose} theme='dark'>
      <NFTPurchase builderId={props.builderId} />
    </BasicModal>
  );
}
