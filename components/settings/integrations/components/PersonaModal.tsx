import Chip from '@mui/material/Chip';
import { usePopupState } from 'material-ui-popup-state/hooks';
import dynamic from 'next/dynamic';

import { useGetPersonaInquiry, useInitPersonaInquiry } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useUser } from 'hooks/useUser';

const PersonaInquiry = dynamic(() => import('persona').then((module) => module.Inquiry), { ssr: false });

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

export function PersonaModal({ spaceId }: { spaceId: string }) {
  const { user } = useUser();
  const { data: personaUserKyc, isLoading: isPersonaUserKycLoading } = useGetPersonaInquiry(spaceId);
  const {
    data: personaInquiry,
    trigger: initPersonaInquiry,
    isMutating: isLoadingPersonaInquiry
  } = useInitPersonaInquiry(spaceId);
  const { showConfirmation } = useConfirmationModal();
  const popupPersonaState = usePopupState({ variant: 'popover', popupId: 'kyc-persona' });
  const disabled = ['pending', 'completed', 'needs_review', 'approved'].includes(personaUserKyc?.status || '');

  const onConfirm = async () => {
    await initPersonaInquiry();
    popupPersonaState.open();
  };

  const onStart = async () => {
    await showConfirmation({
      message: 'You will be redirected to our partner Persona to finish your KYC.',
      title: 'KYC aknowledgement',
      confirmButton: 'Confirm',
      loading: isPersonaUserKycLoading || isLoadingPersonaInquiry,
      onConfirm
    });
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
          onClick={onStart}
          disabled={isPersonaUserKycLoading || isLoadingPersonaInquiry || disabled}
          data-test='start-persona-kyc'
        >
          Test KYC
        </Button>
      )}
      {personaInquiry?.inquiryId && (
        <Modal
          size='fluid'
          onClose={popupPersonaState.close}
          open={popupPersonaState.isOpen}
          sx={{ '& iframe': { minWidth: '375px', width: '100%', minHeight: '600px', height: '100%' } }}
        >
          <PersonaInquiry
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
