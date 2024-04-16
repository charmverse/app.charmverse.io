import Typography from '@mui/material/Typography';
import { Synaps } from '@synaps-io/verify-sdk';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';

import { useGetSynapsSession, useInitSynapsSession } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

export function SynapsModal({ spaceId }: { spaceId: string }) {
  const { data: synapsUserKyc, isLoading: isSynapsUserKycLoading } = useGetSynapsSession(spaceId);
  const { trigger: initSession, data: synapsSession, isMutating: initSessionLoading } = useInitSynapsSession(spaceId);
  const popupState = usePopupState({ variant: 'popover', popupId: 'confirm-kyc' });
  const disabled = ['APPROVED', 'PENDING_VERIFICATION', 'REJECTED'].includes(synapsUserKyc?.status || '');

  const openModal = async () => {
    if (disabled) {
      return;
    }

    await initSession();
    popupState.open();
  };

  return (
    <>
      <Button
        onClick={openModal}
        loading={initSessionLoading}
        disabled={synapsUserKyc === undefined || initSessionLoading || isSynapsUserKycLoading || disabled}
      >
        Start KYC
      </Button>
      {synapsSession && (
        <SynapsModalWithConfirmation
          sessionId={synapsSession.session_id}
          onClose={popupState.close}
          open={popupState.isOpen}
        />
      )}
    </>
  );
}

export function SynapsModalWithConfirmation({
  sessionId,
  onClose,
  open
}: {
  sessionId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { onClose: closeSettingsModal } = useSettingsDialog();

  useEffect(() => {
    let init = true;

    Synaps.init({
      sessionId,
      service: 'individual',
      mode: 'modal',
      onFinish: () => {},
      onClose: () => {}
    });

    return () => {
      init = false;
    };
  }, []);

  const handleOpen = () => {
    onClose();
    closeSettingsModal();
    Synaps.show();
  };

  return (
    <ModalWithButtons
      title='KYC aknowledgement'
      buttonText='Confirm'
      onConfirm={handleOpen}
      onClose={onClose}
      open={open}
    >
      <Typography>You will be redirected to our partner Synaps.io to finish your KYC.</Typography>
    </ModalWithButtons>
  );
}
