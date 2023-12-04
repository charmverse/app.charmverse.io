import styled from '@emotion/styled';
import { Delete } from '@mui/icons-material';
import { IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { getDisabledTooltip } from 'components/proposals/components/AttachRewardButton';
import { RewardTokenInfo } from 'components/rewards/components/RewardProperties/components/RewardTokenInfo';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsNavigation } from 'components/rewards/hooks/useRewardsNavigation';
import { useCharmRouter } from 'hooks/useCharmRouter';
import type { ProposalPendingReward } from 'lib/proposal/blocks/interfaces';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utilities/types';

type Props = {
  pendingRewards: ProposalPendingReward[] | undefined;
  rewardIds: string[];
  readOnly: boolean;
  onSave: (reward: ProposalPendingReward) => void;
  onDelete: (draftId: string) => void;
};

const rewardQueryKey = 'rewardId';

export function ProposalRewards({ pendingRewards, readOnly, onSave, onDelete, rewardIds }: Props) {
  useRewardsNavigation(rewardQueryKey);

  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);
  const { getRewardPage } = useRewardPage();
  const { rewards: allRewards } = useRewards();
  const { updateURLQuery } = useCharmRouter();
  const rewards = rewardIds?.map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy) || [];

  function closeDialog() {
    clearRewardValues();
    clearNewPage();
  }

  async function saveForm() {
    onSave({ reward: rewardValues, page: newPageValues, draftId: currentPendingId || '' });
    closeDialog();
  }

  function editReward({ reward, page, draftId }: ProposalPendingReward) {
    if (readOnly) return;

    setRewardValues(reward);
    openNewPage(page || undefined);
    setCurrentPendingId(draftId);
  }

  function openReward(rewardId: string | null) {
    if (!rewardId) return;

    const pageId = getRewardPage(rewardId)?.id || rewardId;
    updateURLQuery({ [rewardQueryKey]: pageId });
  }

  if (rewards.length) {
    return (
      <Stack>
        {rewards.map((reward) => {
          return (
            <Stack
              flexDirection='row'
              alignItems='center'
              height='fit-content'
              flex={1}
              className='octo-propertyrow'
              key={reward.id}
            >
              <PropertyLabel readOnly highlighted>
                Reward
              </PropertyLabel>
              <SelectPreviewContainer displayType='details' onClick={() => openReward(reward.id)}>
                <Stack alignItems='center' gap={1} direction='row'>
                  <Typography component='span' variant='subtitle1' fontWeight='normal'>
                    {getRewardPage(reward.id)?.title || 'Untitled reward'}
                  </Typography>
                  {reward.customReward ? (
                    <Typography component='span' variant='subtitle1' fontWeight='normal'>
                      {reward.customReward}
                    </Typography>
                  ) : (
                    <RewardTokenInfo
                      chainId={reward.chainId || null}
                      symbolOrAddress={reward.rewardToken || null}
                      rewardAmount={reward.rewardAmount || null}
                    />
                  )}
                </Stack>
              </SelectPreviewContainer>
            </Stack>
          );
        })}
      </Stack>
    );
  }
  return (
    <Stack>
      {pendingRewards?.map(({ reward, page, draftId }) => {
        return (
          <Stack
            flexDirection='row'
            alignItems='center'
            height='fit-content'
            flex={1}
            className='octo-propertyrow'
            key={draftId}
          >
            <PropertyLabel readOnly highlighted>
              Reward
            </PropertyLabel>

            <Stack
              alignItems='center'
              gap={1}
              direction='row'
              sx={{
                '&:hover .icons': {
                  opacity: 1
                }
              }}
            >
              <SelectPreviewContainer
                readOnly={readOnly}
                displayType='details'
                onClick={() => editReward({ reward, page, draftId })}
              >
                <Stack alignItems='center' gap={1} direction='row'>
                  <Typography component='span' variant='subtitle1' fontWeight='normal'>
                    {page?.title || 'Untitled reward'}
                  </Typography>
                  {reward.customReward ? (
                    <Typography component='span' variant='subtitle1' fontWeight='normal'>
                      {reward.customReward}
                    </Typography>
                  ) : (
                    <RewardTokenInfo
                      chainId={reward.chainId || null}
                      symbolOrAddress={reward.rewardToken || null}
                      rewardAmount={reward.rewardAmount || null}
                    />
                  )}
                  <Typography
                    component='span'
                    variant='subtitle1'
                    fontWeight='normal'
                    color='secondary'
                    fontStyle='italic'
                  >
                    (pending)
                  </Typography>
                </Stack>
              </SelectPreviewContainer>

              <Stack className='icons' sx={{ opacity: 0, transition: 'all 0.2s ease' }}>
                <IconButton size='small' onClick={() => onDelete(draftId)}>
                  <Delete color='secondary' fontSize='small' />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        );
      })}

      <NewPageDialog
        contentUpdated={contentUpdated || isDirty}
        disabledTooltip={getDisabledTooltip({ newPageValues, rewardValues })}
        isOpen={!!newPageValues}
        onClose={closeDialog}
        onSave={saveForm}
        onCancel={closeDialog}
        isSaving={isSavingReward}
      >
        <NewDocumentPage
          titlePlaceholder='Reward title (required)'
          values={newPageValues}
          onChange={updateNewPageValues}
        >
          <RewardPropertiesForm
            onChange={setRewardValues}
            values={rewardValues}
            isNewReward
            isTemplate={false}
            expandedByDefault
            forcedApplicationType='assigned'
          />
        </NewDocumentPage>
      </NewPageDialog>
    </Stack>
  );
}
