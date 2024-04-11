import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';
import persona from 'persona';
import { useEffect, useMemo } from 'react';

import { useGetSynapsSession } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useUser } from 'hooks/useUser';

function PersonaModalWithConfirmation({
  userId,
  onClose,
  open,
  templateId,
  environmentId
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  templateId: string;
  environmentId: string;
}) {
  const { onClose: closeSettingsModal } = useSettingsDialog();

  const client = useMemo(() => {
    return new persona.Client({
      templateId,
      environmentId,
      referenceId: userId,
      onReady: () => {},
      onComplete: ({ inquiryId, status, fields }) => {}
    });
  }, []);

  useEffect(() => {
    return () => {
      client?.destroy();
    };
  }, []);

  const handleOpen = () => {
    onClose();
    closeSettingsModal();
    client?.open();
  };

  return (
    <ModalWithButtons
      title='KYC aknowledgement'
      buttonText='Confirm'
      onConfirm={handleOpen}
      onClose={onClose}
      open={open}
    >
      <Typography>You will be redirected to our partner Persona to finish your KYC.</Typography>
    </ModalWithButtons>
  );
}

export default function PersonaModal({
  spaceId,
  templateId,
  environmentId
}: {
  spaceId: string;
  templateId: string;
  environmentId: string;
}) {
  const { user } = useUser();
  const { data: synapsUserKyc, isLoading: isSynapsUserKycLoading } = useGetSynapsSession(spaceId);
  const popupState = usePopupState({ variant: 'popover', popupId: 'confirm-kyc' });
  const disabled = ['APPROVED', 'PENDING_VERIFICATION'].includes(synapsUserKyc?.status || '');

  const openModal = async () => {
    if (disabled) {
      return;
    }

    popupState.open();
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Button onClick={openModal} disabled={isSynapsUserKycLoading || disabled}>
        Start KYC
      </Button>
      <PersonaModalWithConfirmation
        userId={user?.id}
        onClose={popupState.close}
        open={popupState.isOpen}
        templateId={templateId}
        environmentId={environmentId}
      />
    </>
  );
}
