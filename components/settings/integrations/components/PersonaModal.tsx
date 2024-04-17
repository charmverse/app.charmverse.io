import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Persona from 'persona';

import { useGetPersonaInquiry, useInitPersonaInquiry } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useUser } from 'hooks/useUser';

const mapPersonaStatus = {
  pending: 'Pending',
  completed: 'Completed',
  needs_review: 'Needs review',
  approved: 'Approved',
  created: 'Created',
  failed: 'Failed',
  expired: 'Expired',
  declined: 'Declined'
};

export default function PersonaModal({ spaceId }: { spaceId: string }) {
  const { user } = useUser();
  const { data: personaUserKyc, isLoading: isPersonaUserKycLoading } = useGetPersonaInquiry(spaceId);
  const {
    data: personaInquiry,
    trigger: initPersonaInquiry,
    isMutating: isLoadingPersonaInquiry
  } = useInitPersonaInquiry(spaceId);
  const popupConfirmationState = usePopupState({ variant: 'popover', popupId: 'confirm-kyc' });
  const popupPersonaState = usePopupState({ variant: 'popover', popupId: 'kyc-persona' });
  const disabled = ['pending', 'completed', 'needs_review', 'approved'].includes(personaUserKyc?.status || '');

  const handleConfirm = async () => {
    await initPersonaInquiry();
    popupConfirmationState.close();
    popupPersonaState.open();
  };

  return (
    <>
      {personaUserKyc && disabled ? (
        <Chip
          clickable={false}
          color='secondary'
          size='small'
          variant='outlined'
          label={`Status: ${personaUserKyc.status ? mapPersonaStatus[personaUserKyc.status] : 'Unknown'}`}
        />
      ) : (
        <Button
          onClick={popupConfirmationState.open}
          disabled={isPersonaUserKycLoading || isLoadingPersonaInquiry || disabled}
          data-test='start-persona-kyc'
        >
          Test KYC
        </Button>
      )}

      <ModalWithButtons
        title='KYC aknowledgement'
        buttonText='Confirm'
        onConfirm={handleConfirm}
        onClose={popupConfirmationState.close}
        open={popupConfirmationState.isOpen}
        loading={isPersonaUserKycLoading || isLoadingPersonaInquiry}
      >
        <Typography>You will be redirected to our partner Persona to finish your KYC.</Typography>
      </ModalWithButtons>
      {personaInquiry?.inquiryId && (
        <Modal
          size='fluid'
          onClose={popupPersonaState.close}
          open={popupPersonaState.isOpen}
          sx={{ '& iframe': { minWidth: '375px', width: '100%', minHeight: '600px', height: '100%' } }}
        >
          <Persona.Inquiry
            inquiryId={personaInquiry?.inquiryId}
            referenceId={user?.id}
            onComplete={() => {
              // Inquiry completed. Close the modal
              popupPersonaState.close();
            }}
          />
        </Modal>
      )}
    </>
  );
}
