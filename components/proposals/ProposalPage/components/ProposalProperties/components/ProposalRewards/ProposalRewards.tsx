import type { ProposalReviewer } from '@charmverse/core/prisma';
import { Delete, Edit } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Grid, Hidden, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { uniqBy } from 'lodash';
import { useState } from 'react';
import { v4 } from 'uuid';

import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { RewardAmount } from 'components/rewards/components/RewardStatusBadge';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsNavigation } from 'components/rewards/hooks/useRewardsNavigation';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from 'lib/proposals/interfaces';
import { getRewardErrors } from 'lib/rewards/getRewardErrors';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardReviewer } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utils/types';

import { AttachRewardButton } from './AttachRewardButton';

type Props = {
  pendingRewards: ProposalPendingReward[] | undefined;
  rewardIds: string[];
  readOnly?: boolean;
  onSave: (reward: ProposalPendingReward) => void;
  onDelete: (draftId: string) => void;
  reviewers: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
  assignedSubmitters: string[];
  requiredTemplateId?: string | null;
  variant?: 'solid_button' | 'card_property'; // solid_button is used for form proposals
  isProposalTemplate?: boolean;
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
  requiredTemplateId,
  variant,
  isProposalTemplate
}: Props) {
  useRewardsNavigation(rewardQueryKey);
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);
  const { getRewardPage } = useRewardPage();
  const { rewards: allRewards } = useRewards();
  const { templates } = useRewardTemplates({ load: !!requiredTemplateId });

  const { getFeatureTitle } = useSpaceFeatures();
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
    setCurrentPendingId(null);
  }

  async function saveForm() {
    if (newPageValues) {
      onSave({ reward: rewardValues, page: newPageValues, draftId: currentPendingId || '' });
      closeDialog();
    }
  }

  function createNewReward() {
    clearRewardValues();
    const template = templates?.find((t) => t.page.id === requiredTemplateId);
    // use reviewers from the proposal if not set in the template
    const rewardReviewers = template?.reward.reviewers?.length
      ? template.reward.reviewers
      : uniqBy(
          reviewers
            .map((reviewer) =>
              reviewer.roleId
                ? { group: 'role', id: reviewer.roleId }
                : reviewer.userId
                ? { group: 'user', id: reviewer.userId }
                : null
            )
            .filter(isTruthy) as RewardReviewer[],
          'id'
        );
    const rewardAssignedSubmitters = template?.reward.allowedSubmitterRoles?.length
      ? template.reward.allowedSubmitterRoles
      : assignedSubmitters;

    const newReward = { ...template?.reward, reviewers: rewardReviewers, assignedSubmitters: rewardAssignedSubmitters };
    if (template?.reward) {
      (newReward as any).rewardType = getRewardType(template.reward);
    }
    setRewardValues(newReward, { skipDirty: true });

    openNewPage({
      ...template?.page,
      content: template?.page.content as any,
      templateId: requiredTemplateId || undefined,
      title: undefined,
      type: 'bounty'
    });
    // set a new draftId
    setCurrentPendingId(v4());
  }

  function showReward({ reward, page, draftId }: ProposalPendingReward) {
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
    const pageIdToOpen = getRewardPage(rewardId)?.id;

    updateURLQuery({ [rewardQueryKey]: pageIdToOpen });
  }

  function selectTemplate(template: RewardTemplate | null) {
    if (template) {
      const rewardType = getRewardType(template.reward);
      setRewardValues({ rewardType, ...template.reward });
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

  const newRewardErrors = getRewardErrors({
    page: newPageValues,
    reward: rewardValues,
    rewardType: rewardValues.rewardType,
    isProposalTemplate
  }).join(', ');

  if (rewards.length) {
    return (
      <Stack gap={0.5} flex={1} width='500px' maxWidth='100%'>
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
                  </Hidden>
                </Stack>
              </SelectPreviewContainer>
            </Stack>
          );
        })}
      </Stack>
    );
  }

  return (
    <>
      {!!pendingRewards?.length && (
        <Stack gap={0.5} flex={1} width='500px' maxWidth='100%'>
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
                          <Tooltip title={readOnly ? 'View' : 'Edit'}>
                            <span>
                              <IconButton size='small' onClick={() => showReward({ reward, page, draftId })}>
                                {readOnly ? (
                                  <VisibilityIcon color='secondary' fontSize='small' />
                                ) : (
                                  <Edit color='secondary' fontSize='small' />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          {!readOnly && (
                            <Tooltip title='Delete'>
                              <span>
                                <IconButton size='small' onClick={() => onDelete(draftId)} disabled={readOnly}>
                                  <Delete color='secondary' fontSize='small' />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Stack>
                </SelectPreviewContainer>
              </Stack>
            );
          })}

          {canCreatePendingRewards && (
            <Box>
              <AttachRewardButton createNewReward={createNewReward} variant={variant} />
            </Box>
          )}
        </Stack>
      )}
      {!pendingRewards?.length && <AttachRewardButton createNewReward={createNewReward} variant={variant} />}

      <NewPageDialog
        contentUpdated={!readOnly && (contentUpdated || isDirty)}
        disabledTooltip={newRewardErrors}
        isOpen={!!newPageValues}
        onClose={closeDialog}
        onSave={saveForm}
        onCancel={closeDialog}
        isSaving={isSavingReward}
      >
        <NewDocumentPage
          key={newPageValues?.templateId}
          titlePlaceholder={`${getFeatureTitle('Reward')} title (required)`}
          values={newPageValues}
          onChange={updateNewPageValues}
        >
          <RewardPropertiesForm
            onChange={setRewardValues}
            values={rewardValues}
            isNewReward
            readOnly={readOnly}
            isTemplate={false}
            expandedByDefault
            forcedApplicationType='assigned'
            templateId={newPageValues?.templateId}
            readOnlyTemplate={!!requiredTemplateId}
            selectTemplate={selectTemplate}
            isProposalTemplate={isProposalTemplate}
          />
        </NewDocumentPage>
      </NewPageDialog>
    </>
  );
}
