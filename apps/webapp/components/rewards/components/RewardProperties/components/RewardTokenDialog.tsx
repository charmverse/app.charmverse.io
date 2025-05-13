import { Box, Stack } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { SelectPreviewContainer } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import type { PropertyValueDisplayType } from 'components/common/DatabaseEditor/interfaces';
import { Modal } from 'components/common/Modal';
import type { RewardCreationData } from '@packages/lib/rewards/createReward';
import type { RewardTokenDetails, RewardWithUsers } from '@packages/lib/rewards/interfaces';

import type { FormInput } from '../../RewardEvaluations/components/Settings/components/PaymentStepSettings/components/RewardTokenForm';
import { RewardTokenForm } from '../../RewardEvaluations/components/Settings/components/PaymentStepSettings/components/RewardTokenForm';

export function RewardTokenDialog({
  displayType,
  currentReward,
  requireTokenAmount,
  readOnly,
  readOnlyToken,
  readOnlyTokenAmount,
  children,
  onChange
}: {
  displayType?: PropertyValueDisplayType;
  readOnly: boolean;
  readOnlyToken?: boolean;
  readOnlyTokenAmount?: boolean;
  requireTokenAmount: boolean;
  currentReward: Pick<RewardCreationData & RewardWithUsers, 'rewardAmount' | 'rewardToken' | 'chainId'>;
  children: ReactNode;
  onChange: (value: RewardTokenDetails | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState<FormInput>(currentReward);
  const [isValid, setIsValid] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  const onSubmit = () => {
    onChange(tokenInput as RewardTokenDetails);
    handleClose();
  };

  function openTokenSettings() {
    if (!readOnly) {
      setIsOpen(true);
    }
  }

  return (
    <>
      <SelectPreviewContainer
        data-test='open-reward-value-dialog'
        readOnly={readOnly && readOnlyToken}
        displayType={displayType}
        onClick={openTokenSettings}
      >
        {children}
      </SelectPreviewContainer>

      <Modal
        data-test='reward-value-configuration'
        open={isOpen}
        onClose={handleClose}
        size='500px'
        title='Edit token details'
      >
        <Box mb={2}>
          <RewardTokenForm
            onChange={setTokenInput}
            defaultValues={tokenInput}
            readOnly={readOnly}
            readOnlyToken={readOnlyToken}
            readOnlyTokenAmount={readOnlyTokenAmount}
            requireTokenAmount={requireTokenAmount}
            setIsValid={setIsValid}
          />
        </Box>
        <Stack gap={1} flexDirection='row' alignItems='center' justifyContent='flex-end'>
          <Button onClick={handleClose} variant='outlined' color='secondary'>
            Cancel
          </Button>

          <Button disabled={!isValid} data-test='save-reward-value' onClick={onSubmit}>
            Save
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
