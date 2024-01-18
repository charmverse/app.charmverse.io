import type { EmotionJSX } from '@emotion/react/types/jsx-namespace';
import { forwardRef } from 'react';

import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';

import type { Screens } from '../hooks/useTwoFactorAuth';
import { TwoFactorAuthProvider, useTwoFactorAuth } from '../hooks/useTwoFactorAuth';

import { ConfirmationScreen } from './TwoFactorAuthScreens/ConfirmationScreen';
import { FinishScreen } from './TwoFactorAuthScreens/FinishScreen';
import { LinkScreen } from './TwoFactorAuthScreens/LinkScreen';
import { StartScreen } from './TwoFactorAuthScreens/StartScreen';

const modalScreens: Record<Screens, (props: { onClose?: () => void }) => EmotionJSX.Element | null> = {
  start: StartScreen,
  link: LinkScreen,
  confirmation: ConfirmationScreen,
  finish: FinishScreen
};

function CustomModal({ onClose, ...props }: Omit<ModalProps, 'children'>) {
  const { flow, setFlow } = useTwoFactorAuth();
  const FlowElement = modalScreens[flow];

  const handleClose = onClose
    ? () => {
        onClose();
        setFlow('start');
      }
    : undefined;

  return (
    <Modal title='Two factor authentication' size='medium' onClose={handleClose} {...props}>
      <FlowElement onClose={handleClose} />
    </Modal>
  );
}

const TwoFactorAuthSetupModalComponent = forwardRef(CustomModal);

export function CustomModalContainer(props: Omit<ModalProps, 'children'>) {
  return (
    <TwoFactorAuthProvider>
      <TwoFactorAuthSetupModalComponent {...props} />
    </TwoFactorAuthProvider>
  );
}

export const TwoFactorAuthSetupModal = forwardRef(CustomModalContainer);
