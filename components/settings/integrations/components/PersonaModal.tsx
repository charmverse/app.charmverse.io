import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Persona from 'persona';

import { useGetSynapsSession } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useUser } from 'hooks/useUser';

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
  const popupConfirmationState = usePopupState({ variant: 'popover', popupId: 'confirm-kyc' });
  const popupPersonaState = usePopupState({ variant: 'popover', popupId: 'kyc-persona' });
  const disabled = ['APPROVED', 'PENDING_VERIFICATION'].includes(synapsUserKyc?.status || '');

  const handleConfirm = () => {
    popupConfirmationState.close();
    popupPersonaState.open();
  };

  return (
    <>
      <Button onClick={popupConfirmationState.open} disabled={isSynapsUserKycLoading || disabled}>
        Start KYC
      </Button>
      <ModalWithButtons
        title='KYC aknowledgement'
        buttonText='Confirm'
        onConfirm={handleConfirm}
        onClose={popupConfirmationState.close}
        open={popupConfirmationState.isOpen}
      >
        <Typography>You will be redirected to our partner Persona to finish your KYC.</Typography>
      </ModalWithButtons>
      <Modal
        size='fluid'
        onClose={popupPersonaState.close}
        open={popupPersonaState.isOpen}
        sx={{
          '& iframe': { minWidth: '375px', width: '100%', minHeight: '600px', height: '100%' }
        }}
      >
        <Persona.Inquiry
          templateId={templateId}
          environmentId={environmentId}
          referenceId={user?.id}
          onLoad={() => {}}
          onComplete={({ inquiryId, status, fields }) => {
            // Inquiry completed. Optionally tell your server about it.
            // console.log(`Sending finished inquiry ${inquiryId} to backend`);
            popupPersonaState.close();
          }}
        />
      </Modal>
    </>
  );
}
