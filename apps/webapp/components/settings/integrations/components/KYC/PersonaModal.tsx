import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { usePopupState } from 'material-ui-popup-state/hooks';
import dynamic from 'next/dynamic';

import { useGetPersonaInquiry, useInitPersonaInquiry } from 'charmClient/hooks/kyc';
import { Button } from 'components/common/Button';
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

export function PersonaModal({ spaceId, userId, isAdmin }: { spaceId: string; userId?: string; isAdmin?: boolean }) {
  const {
    data: personaUserKyc,
    isLoading: isPersonaUserKycLoading,
    mutate: mutatePersonaUserKyc
  } = useGetPersonaInquiry(spaceId, userId);
  const {
    data: personaInquiry,
    trigger: initPersonaInquiry,
    isMutating: isLoadingPersonaInquiry
  } = useInitPersonaInquiry(spaceId);
  const popupPersonaState = usePopupState({ variant: 'popover', popupId: 'kyc-persona' });
  const disabled = ['pending', 'completed', 'needs_review', 'approved'].includes(personaUserKyc?.status || '');
  const { user } = useUser();

  const onConfirm = async () => {
    await initPersonaInquiry();
    popupPersonaState.open();
  };

  if (personaUserKyc?.status && disabled) {
    return (
      <Box>
        <Chip
          clickable={false}
          color='secondary'
          size='small'
          variant='outlined'
          label={`Status: ${mapPersonaStatus[personaUserKyc.status] || 'Unknown'}`}
        />
      </Box>
    );
  }

  if (userId && user?.id !== userId) {
    return null;
  }

  return (
    <Box display='flex' flexDirection='column' alignItems='start' gap={2}>
      {isAdmin ? (
        <Chip
          onClick={onConfirm}
          clickable={true}
          color='secondary'
          size='small'
          variant='outlined'
          disabled={isPersonaUserKycLoading || isLoadingPersonaInquiry || disabled}
          label='Test'
          data-test='start-persona-kyc'
        />
      ) : (
        <Button
          onClick={onConfirm}
          disabled={isPersonaUserKycLoading || isLoadingPersonaInquiry || disabled}
          data-test='start-persona-kyc'
        >
          Start KYC
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
            inquiryId={personaInquiry.inquiryId}
            referenceId={userId}
            onComplete={() => {
              mutatePersonaUserKyc();
              popupPersonaState.close();
            }}
          />
        </Modal>
      )}
      {personaUserKyc?.status && (
        <Chip
          clickable={false}
          color='secondary'
          size='small'
          variant='outlined'
          label={`Status: ${mapPersonaStatus[personaUserKyc.status] || 'Unknown'}`}
        />
      )}
    </Box>
  );
}
