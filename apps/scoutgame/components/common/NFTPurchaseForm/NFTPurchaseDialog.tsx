'use client';

import { BasicModal } from 'components/common/Modal';

import { NFTPurchaseForm } from './NFTPurchaseForm';

export function NFTPurchaseDialog(props: { open: boolean; onClose: VoidFunction; builderId: string }) {
  return (
    <BasicModal open={props.open} onClose={props.onClose} theme='dark'>
      <NFTPurchaseForm builderId={props.builderId} />
    </BasicModal>
  );
}
