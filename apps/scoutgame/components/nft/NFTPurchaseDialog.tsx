import type { Scout } from '@charmverse/core/prisma-client';

import { BasicModal } from 'components/common/Modal';

import { NFTPurchase } from './NFTPurchase';

export function NFTPurchaseDialog(props: { onClose: VoidFunction; builderId?: string | null; scout?: Scout | null }) {
  if (!props.scout || !props.builderId) {
    return null;
  }
  return (
    <BasicModal open onClose={props.onClose} theme='dark'>
      <NFTPurchase builderId={props.builderId as string} scout={props.scout as Scout} />
    </BasicModal>
  );
}
