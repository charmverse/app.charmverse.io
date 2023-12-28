import { Delete, Edit } from '@mui/icons-material';
import { Box, Grid, Hidden, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { EmptyPlaceholder } from 'components/common/BoardEditor/components/properties/EmptyPlaceholder';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import {
  AttachRewardButton,
  getDisabledTooltip
} from 'components/proposals/components/ProposalRewards/AttachRewardButton';
import { RewardTokenInfo } from 'components/rewards/components/RewardProperties/components/RewardTokenInfo';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsNavigation } from 'components/rewards/hooks/useRewardsNavigation';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from 'lib/proposal/blocks/interfaces';
import type { ProposalReviewerInput } from 'lib/proposal/interface';
import { isTruthy } from 'lib/utilities/types';

type Props = {
  pendingRewards: ProposalPendingReward[] | undefined;
  rewardIds: string[];
  readOnly: boolean;
  onSave: (reward: ProposalPendingReward) => void;
  onDelete: (draftId: string) => void;
  reviewers: ProposalReviewerInput[];
  assignedSubmitters: string[];
};

const rewardQueryKey = 'rewardId';

export function ProposalRewards({
  pendingRewards,
  readOnly,
  onSave,
  onDelete,
  rewardIds,
  reviewers,
  assignedSubmitters
}: Props) {
  useRewardsNavigation(rewardQueryKey);
  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;

  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);
  const { getRewardPage } = useRewardPage();
  const { rewards: allRewards } = useRewards();
  const {
    updateURLQuery,
    navigateToSpacePath,
    router: { query }
  } = useCharmRouter();
  const rewards = rewardIds?.map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy) || [];
  const canCreatePendingRewards = !readOnly && !rewardIds?.length;

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

    const modalView = !!query.id;

    if (!modalView) {
      navigateToSpacePath(`/${getRewardPage(rewardId)?.path || ''}`);
      return;
    }

    const pageId = getRewardPage(rewardId)?.id || rewardId;
    updateURLQuery({ [rewardQueryKey]: pageId });
  }

  if (rewards.length) {
    return (
      <Stack>
        <Stack flexDirection='row' alignItems='center' height='fit-content' flex={1} className='octo-propertyrow'>
          <PropertyLabel readOnly highlighted>
            {rewardsTitle}
          </PropertyLabel>

          <Stack gap={0.5} flex={1}>
            {rewards.map((reward) => {
              return (
                <Stack
                  alignItems='center'
                  gap={1}
                  direction='row'
                  sx={{
                    '&:hover .icons': {
                      opacity: 1
                    }
                  }}
                  key={reward.id}
                  flex={1}
                >
                  <SelectPreviewContainer displayType='details' onClick={() => openReward(reward.id)}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Typography component='span' variant='subtitle1' fontWeight='normal'>
                        {getRewardPage(reward.id)?.title || 'Untitled reward'}
                      </Typography>
                      <Hidden mdDown>
                        <Stack alignItems='center' direction='row' height='100%'>
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
                      </Hidden>
                    </Stack>
                  </SelectPreviewContainer>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack flexDirection='row' alignItems='center' height='fit-content' flex={1} className='octo-propertyrow'>
        <PropertyLabel readOnly highlighted>
          {rewardsTitle}
        </PropertyLabel>
        {!!pendingRewards?.length && (
          <Stack gap={0.5} flex={1}>
            {pendingRewards.map(({ reward, page, draftId }) => {
              return (
                <Stack
                  alignItems='center'
                  gap={1}
                  direction='row'
                  sx={{
                    '&:hover .icons': {
                      opacity: 1
                    }
                  }}
                  key={draftId}
                  flex={1}
                >
                  <SelectPreviewContainer readOnly={readOnly} displayType='details'>
                    <Stack direction='row' justifyContent='space-between' alignItems='center' gap={1}>
                      <Typography component='span' variant='subtitle1' fontWeight='normal'>
                        {page?.title || 'Untitled'}
                      </Typography>
                      <Hidden lgDown>
                        <Stack alignItems='center' direction='row' height='100%'>
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
                      </Hidden>

                      <Stack className='icons' sx={{ opacity: 0, transition: 'opacity 0.2s ease' }} direction='row'>
                        <IconButton size='small' onClick={() => editReward({ reward, page, draftId })}>
                          <Edit color='secondary' fontSize='small' />
                        </IconButton>
                        <IconButton size='small' onClick={() => onDelete(draftId)}>
                          <Delete color='secondary' fontSize='small' />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </SelectPreviewContainer>
                </Stack>
              );
            })}

            <Box mt={-1}>
              <AttachRewardButton
                readOnly={!canCreatePendingRewards}
                onSave={onSave}
                reviewers={reviewers}
                assignedSubmitters={assignedSubmitters}
              />
            </Box>
          </Stack>
        )}
        {!pendingRewards?.length &&
          (canCreatePendingRewards ? (
            <AttachRewardButton
              readOnly={false}
              onSave={onSave}
              reviewers={reviewers}
              assignedSubmitters={assignedSubmitters}
            >
              <SelectPreviewContainer displayType='details'>
                <EmptyPlaceholder>Empty</EmptyPlaceholder>
              </SelectPreviewContainer>
            </AttachRewardButton>
          ) : (
            <SelectPreviewContainer displayType='details' readOnly>
              <EmptyPlaceholder>Empty</EmptyPlaceholder>
            </SelectPreviewContainer>
          ))}
      </Stack>

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
