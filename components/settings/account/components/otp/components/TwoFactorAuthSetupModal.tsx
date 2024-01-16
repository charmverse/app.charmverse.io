import type { EmotionJSX } from '@emotion/react/types/jsx-namespace';
import { forwardRef } from 'react';

import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';

import type { Screens } from '../hooks/useTwoFactorAuth';
import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';

import { ConfirmationScreen } from './TwoFactorAuthScreens/ConfirmationScreen';
import { FinishScreen } from './TwoFactorAuthScreens/FinishScreen';
import { LinkScreen } from './TwoFactorAuthScreens/LinkScreen';
import { StartScreen } from './TwoFactorAuthScreens/StartScreen';

const modalScreens: Record<Screens, () => EmotionJSX.Element | null> = {
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
