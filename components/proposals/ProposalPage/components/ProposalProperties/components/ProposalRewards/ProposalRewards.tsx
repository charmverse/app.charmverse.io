import type { ProposalReviewer } from '@charmverse/core/prisma';
import { Delete, Edit } from '@mui/icons-material';
import { Box, Grid, Hidden, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { RewardTokenInfo } from 'components/rewards/components/RewardProperties/components/RewardTokenInfo';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { RewardAmount } from 'components/rewards/components/RewardStatusBadge';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsNavigation } from 'components/rewards/hooks/useRewardsNavigation';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from 'lib/proposal/interface';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import type { RewardReviewer } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { AttachRewardButton, getDisabledTooltip } from './AttachRewardButton';

type Props = {
  pendingRewards: ProposalPendingReward[] | undefined;
  rewardIds: string[];
  readOnly?: boolean;
  onSave: (reward: ProposalPendingReward) => void;
  onDelete: (draftId: string) => void;
  reviewers: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
  assignedSubmitters: string[];
  requiredTemplateId?: string | null;
};

const rewardQueryKey = 'rewardId';

export function ProposalRewards({
  pendingRewards,
  readOnly,
  onSave,
  onDelete,
  rewardIds,
  reviewers,
  assignedSubmitters,
  requiredTemplateId
}: Props) {
  useRewardsNavigation(rewardQueryKey);
  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);
  const { getRewardPage } = useRewardPage();
  const { rewards: allRewards } = useRewards();
  const { templates } = useRewardTemplates({ load: !!requiredTemplateId });

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

  function createNewReward() {
    clearRewardValues();
    const template = templates?.find((t) => t.page.id === requiredTemplateId);
    // use reviewers from the proposal if not set in the template
    const rewardReviewers = template?.reward.reviewers?.length
      ? template.reward.reviewers
      : (reviewers
          .map((reviewer) =>
            reviewer.roleId
              ? { group: 'role', id: reviewer.roleId }
              : reviewer.userId
              ? { group: 'user', id: reviewer.userId }
              : null
          )
          .filter(isTruthy) as RewardReviewer[]);
    const rewardAssignedSubmitters = template?.reward.allowedSubmitterRoles?.length
      ? template.reward.allowedSubmitterRoles
      : assignedSubmitters;

    setRewardValues(
      { ...template?.reward, reviewers: rewardReviewers, assignedSubmitters: rewardAssignedSubmitters },
      { skipDirty: true }
    );

    openNewPage({
      ...template?.page,
      content: template?.page.content as any,
      templateId: requiredTemplateId || undefined,
      title: undefined,
      type: 'bounty'
    });
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

  function selectTemplate(template: RewardTemplate | null) {
    if (template) {
      setRewardValues(template.reward);
      updateNewPageValues({
        ...template.page,
        content: template.page.content as any,
        title: undefined,
        type: 'bounty',
        templateId: template.page.id
      });
    } else {
      updateNewPageValues({
        templateId: undefined
      });
    }
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
                        {getRewardPage(reward.id)?.title || 'Untitled'}
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
      {!!pendingRewards?.length && (
        <Stack flexDirection='row' alignItems='center' height='fit-content' flex={1} className='octo-propertyrow'>
          <PropertyLabel readOnly highlighted>
            {rewardsTitle}
          </PropertyLabel>
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
                      <Grid container spacing={0.5}>
                        <Grid item xs={8} lg={5}>
                          <Typography component='span' variant='subtitle1' fontWeight='normal'>
                            {page?.title || 'Untitled'}
                          </Typography>
                        </Grid>
                        <Hidden lgDown>
                          <Grid item xs={5}>
                            <Stack alignItems='center' direction='row' height='100%'>
                              <RewardAmount
                                reward={{
                                  chainId: reward.chainId || null,
                                  customReward: reward.customReward || null,
                                  rewardAmount: reward.rewardAmount || null,
                                  rewardToken: reward.rewardToken || null
                                }}
                                truncate={true}
                                truncatePrecision={2}
                                typographyProps={{ variant: 'body2', fontWeight: 'normal', fontSize: 'normal' }}
                              />
                            </Stack>
                          </Grid>
                        </Hidden>

                        <Grid item xs={4} lg={2}>
                          <Stack className='icons' sx={{ opacity: 0, transition: 'opacity 0.2s ease' }} direction='row'>
                            <IconButton
                              size='small'
                              onClick={() => editReward({ reward, page, draftId })}
                              disabled={readOnly}
                            >
                              <Edit color='secondary' fontSize='small' />
                            </IconButton>
                            <IconButton size='small' onClick={() => onDelete(draftId)} disabled={readOnly}>
                              <Delete color='secondary' fontSize='small' />
                            </IconButton>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Stack>
                  </SelectPreviewContainer>
                </Stack>
              );
            })}

            {canCreatePendingRewards && (
              <Box mt={-1}>
                <AttachRewardButton createNewReward={createNewReward} />
              </Box>
            )}
          </Stack>
        </Stack>
      )}
      {!pendingRewards?.length && <AttachRewardButton createNewReward={createNewReward} />}

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
            templateId={newPageValues?.templateId}
            readOnlyTemplate={!!requiredTemplateId}
            selectTemplate={selectTemplate}
          />
        </NewDocumentPage>
      </NewPageDialog>
    </Stack>
  );
}
