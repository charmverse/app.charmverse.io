import Chip from '@mui/material/Chip';
import { usePopupState } from 'material-ui-popup-state/hooks';
import dynamic from 'next/dynamic';

import { useGetPersonaInquiry, useInitPersonaInquiry } from 'charmClient/hooks/spaces';
import Modal from 'components/common/Modal';
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
  const popupPersonaState = usePopupState({ variant: 'popover', popupId: 'kyc-persona' });
  const disabled = ['pending', 'completed', 'needs_review', 'approved'].includes(personaUserKyc?.status || '');

  const onConfirm = async () => {
    await initPersonaInquiry();
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
          label={`Status: ${mapPersonaStatus[personaUserKyc.status] || 'Unknown'}`}
        />
      ) : (
        <Chip
          onClick={onConfirm}
          clickable={true}
          color='secondary'
          size='small'
          variant='outlined'
          disabled={isPersonaUserKycLoading || isLoadingPersonaInquiry || disabled}
          label='Test KYC'
          data-test='start-persona-kyc'
        />
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
