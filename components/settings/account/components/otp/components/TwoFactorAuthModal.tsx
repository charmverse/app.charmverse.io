import { forwardRef } from 'react';

import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';

import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';

import { ConfirmationScreen } from './ConfirmationScreen';
import { FinishScreen } from './FinishScreen';
import { LinkScreen } from './LinkScreen';
import { StartScreen } from './StartScreen';

export type Screens = 'start' | 'link' | 'confirmation' | 'finish';

const modalScreens: Record<Screens, typeof FinishScreen> = {
  start: StartScreen,
  link: LinkScreen,
  confirmation: ConfirmationScreen,
  finish: FinishScreen
};

export function CustomModal({ onClose, ...props }: Omit<ModalProps, 'children'>) {
  const { handleClose, flow } = useTwoFactorAuth();
  const FlowElement = modalScreens[flow];

  return (
    <Modal title='Two factor authentication' size='medium' onClose={handleClose} {...props}>
      <FlowElement />
    </Modal>
  );
}

export const TwoFactorAuthSetupModal = forwardRef(CustomModal);
