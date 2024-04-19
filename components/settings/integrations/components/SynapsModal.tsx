import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { Synaps } from '@synaps-io/verify-sdk';
import { useEffect } from 'react';

import { useGetSynapsSession, useInitSynapsSession } from 'charmClient/hooks/spaces';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

const mapSynapsStatus = {
  APPROVED: 'Approved',
  PENDING_VERIFICATION: 'Pending verification',
  REJECTED: 'Rejected',
  RESUBMISSION_REQUIRED: 'Resubmission required',
  SUBMISSION_REQUIRED: 'Submission required'
};

export function SynapsModal({ spaceId }: { spaceId: string }) {
  const { data: synapsUserKyc, isLoading: isSynapsUserKycLoading } = useGetSynapsSession(spaceId);
  const {
    trigger: initSession,
    data: synapsSession,
    isMutating: initSessionLoading,
    reset
  } = useInitSynapsSession(spaceId);
  const { showConfirmation } = useConfirmationModal();
  const { onClose: closeSettingsModal } = useSettingsDialog();

  const disabled = ['APPROVED', 'PENDING_VERIFICATION', 'REJECTED'].includes(synapsUserKyc?.status || '');

  const openModal = async () => {
    if (disabled) {
      return;
    }

    await initSession();

    await showConfirmation({
      message: 'You will be required to finish your KYC check provided by our partner Persona.',
      title: 'KYC aknowledgement',
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
          reset();
        },
        onClose: () => {
          reset();
        }
      });
    }

    return () => {
      init = false;
    };
  }, [synapsSession?.session_id]);

  return (
    <Box>
      {synapsUserKyc && disabled ? (
        <Chip
          clickable={false}
          color='secondary'
          size='small'
          variant='outlined'
          label={`Status: ${synapsUserKyc.status ? mapSynapsStatus[synapsUserKyc.status] : 'Unknown'}`}
        />
      ) : (
        <Chip
          onClick={openModal}
          clickable={true}
          color='secondary'
          size='small'
          variant='outlined'
          disabled={synapsUserKyc === undefined || initSessionLoading || isSynapsUserKycLoading}
          label='Test KYC'
          data-test='start-synaps-kyc'
        />
      )}
    </Box>
  );
}
