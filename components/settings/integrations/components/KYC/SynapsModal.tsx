import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { Synaps } from '@synaps-io/verify-sdk';
import { useEffect } from 'react';

import { useGetSynapsSession, useInitSynapsSession } from 'charmClient/hooks/kyc';
import { Button } from 'components/common/Button';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useUser } from 'hooks/useUser';

const mapSynapsStatus = {
  APPROVED: 'Approved',
  PENDING_VERIFICATION: 'Pending verification',
  REJECTED: 'Rejected',
  RESUBMISSION_REQUIRED: 'Resubmission required',
  SUBMISSION_REQUIRED: 'Submission required'
};

export function SynapsModal({ spaceId, userId, isAdmin }: { spaceId: string; userId?: string; isAdmin?: boolean }) {
  const {
    data: synapsUserKyc,
    isLoading: isSynapsUserKycLoading,
    mutate: mutateSynapsUserKyc
  } = useGetSynapsSession(spaceId, userId);
  const {
    trigger: initSession,
    data: synapsSession,
    isMutating: initSessionLoading,
    reset
  } = useInitSynapsSession(spaceId);
  const { user } = useUser();
  const { showConfirmation } = useConfirmationModal();
  const { onClose: closeSettingsModal } = useSettingsDialog();

  const disabled = ['APPROVED', 'PENDING_VERIFICATION', 'REJECTED'].includes(synapsUserKyc?.status || '');

  const openModal = async () => {
    if (disabled) {
      return;
    }

    await initSession();

    await showConfirmation({
      message: 'Verify your identity securely and seamlessly with our trusted partner Synaps.',
      title: 'Start',
      confirmButton: 'Confirm',
      loading: isSynapsUserKycLoading || initSessionLoading,
      onConfirm: async () => {
        closeSettingsModal();
        Synaps.show();
      }
    });
  };

  useEffect(() => {
    let init = false;

    if (synapsSession?.session_id) {
      init = true;

      Synaps.init({
        sessionId: synapsSession.session_id,
        service: 'individual',
        mode: 'modal',
        onFinish: () => {
          mutateSynapsUserKyc();
          reset();
        },
        onClose: () => {
          mutateSynapsUserKyc();
          reset();
        }
      });
    }

    return () => {
      init = false;
    };
  }, [synapsSession?.session_id]);

  if (synapsUserKyc?.status && disabled) {
    return (
      <Box>
        <Chip
          clickable={false}
          color='secondary'
          size='small'
          variant='outlined'
          label={`Status: ${mapSynapsStatus[synapsUserKyc.status] || 'Unknown'}`}
        />
      </Box>
    );
  }

  if (userId && userId !== user?.id) {
    return null;
  }

  return (
    <Box display='flex' flexDirection='column' alignItems='start' gap={2}>
      {isAdmin ? (
        <Chip
          onClick={openModal}
          clickable={true}
          color='secondary'
          size='small'
          variant='outlined'
          disabled={synapsUserKyc === undefined || initSessionLoading || isSynapsUserKycLoading}
          label='Test'
          data-test='start-synaps-kyc'
        />
      ) : (
        <Button
          onClick={openModal}
          data-test='start-synaps-kyc'
          disabled={synapsUserKyc === undefined || initSessionLoading || isSynapsUserKycLoading}
        >
          Start KYC
        </Button>
      )}
      {synapsUserKyc?.status && (
        <Chip
          clickable={false}
          color='secondary'
          size='small'
          variant='outlined'
          label={`Status: ${mapSynapsStatus[synapsUserKyc.status] || 'Unknown'}`}
        />
      )}
    </Box>
  );
}
