import { Stack } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from 'components/common/Button';
import { SelectPreviewContainer } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import type { PropertyValueDisplayType } from 'components/common/DatabaseEditor/interfaces';
import { Dialog } from 'components/common/Dialog/Dialog';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardTokenDetails, RewardWithUsers } from 'lib/rewards/interfaces';

import type { FormInput } from '../../RewardEvaluations/components/Settings/components/PaymentStepSettings/components/RewardTokenForm';
import { RewardTokenForm } from '../../RewardEvaluations/components/Settings/components/PaymentStepSettings/components/RewardTokenForm';

export function RewardTokenDialog({
  displayType,
  currentReward,
  requireTokenAmount,
  readOnly,
  readOnlyToken,
  children,
  onChange
}: {
  displayType?: PropertyValueDisplayType;
  readOnly: boolean;
  readOnlyToken: boolean;
  requireTokenAmount: boolean;
  currentReward: Pick<RewardCreationData & RewardWithUsers, 'rewardAmount' | 'rewardToken' | 'chainId'>;
  children: ReactNode;
  onChange: (value: RewardTokenDetails | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState<FormInput>(currentReward);
  const [isValid, setIsValid] = useState(false);

  // const {
  //   control,
  //   handleSubmit,
  //   reset,
  //   setValue,
  //   watch,
  //   formState: { errors, isValid }
  // } = useForm<FormInput>({
  //   defaultValues: {
  //     rewardToken: currentReward.rewardToken || '',
  //     chainId: currentReward.chainId || undefined,
  //     rewardAmount: currentReward.rewardAmount || undefined
  //   }
  // });

  const handleClose = () => {
    setIsOpen(false);
  };

  const onSubmit = () => {
    onChange(tokenInput as RewardTokenDetails);
    handleClose();
  };

  function openTokenSettings() {
    setIsOpen(true);
    // reset({
    //   rewardToken: currentReward?.rewardToken || '',
    //   chainId: currentReward?.chainId || undefined,
    //   rewardAmount: currentReward?.rewardAmount || undefined
    // });
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
      <Dialog
        open={isOpen}
        data-test='reward-value-configuration'
        onClose={handleClose}
        title='Reward token details'
        footerActions={
          <Stack gap={2} flexDirection='row' alignItems='center'>
            <Button
              sx={{
                alignSelf: 'flex-start'
              }}
              onClick={handleClose}
              variant='outlined'
              color='secondary'
            >
              Cancel
            </Button>

            <Button
              disabled={!isValid}
              data-test='save-reward-value'
              onClick={onSubmit}
              sx={{
                alignSelf: 'flex-start'
              }}
            >
              Save
            </Button>
          </Stack>
        }
      >
        <RewardTokenForm
          onChange={setTokenInput}
          defaultValues={tokenInput}
          readOnly={readOnly}
          readOnlyToken={readOnlyToken}
          requireTokenAmount={requireTokenAmount}
          readOnlyTokenAmount={false} // TODO: probably needs to be based on some prop?
          setIsValid={setIsValid}
        />
      </Dialog>
    </>
  );
}
