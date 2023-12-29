import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import { Typography } from '@mui/material';
import { useState } from 'react';

import { useCreateProposalRewards } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export type Props = {
  disabled: boolean;
  proposalId: string;
  onSubmit: VoidFunction;
};

export function PublishRewardsButton({ proposalId, disabled, onSubmit }: Props) {
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const { trigger, isMutating } = useCreateProposalRewards(proposalId);
  const { showMessage } = useSnackbar();
  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;

  async function createRewards() {
    try {
      await trigger();
      showMessage('Rewards created', 'success');
      onSubmit();
      // mutateRewards();
    } catch (e) {
      showMessage((e as any).message, 'error');
    }
  }

  return (
    <>
      <Button
        disabled={disabled}
        disabledTooltip={`Only reviewers can publish ${rewardsTitle}`}
        color='success'
        endIcon={<BountyIcon />}
        loading={isMutating}
        onClick={() => setShowConfirmation(true)}
      >
        Publish {rewardsTitle}
      </Button>
      <ModalWithButtons
        open={showConfirmation}
        title={`Publish ${rewardsTitle}?`}
        buttonText='Publish'
        onClose={() => setShowConfirmation(false)}
        // wrap the function so it does not return a promise to the confirmation modal
        onConfirm={() => createRewards()}
      >
        <Typography>This action cannot be done</Typography>
      </ModalWithButtons>
    </>
  );
}
