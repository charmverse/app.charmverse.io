import type { ProposalReviewer } from '@charmverse/core/prisma';
import { Delete, Edit } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Grid, Hidden, IconButton, Stack, Tooltip, Typography } from '@mui/material';

import { SelectPreviewContainer } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { RewardAmount } from 'components/rewards/components/RewardStatusBadge';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalPendingReward } from 'lib/proposals/interfaces';
import { isTruthy } from 'lib/utils/types';

import { useProposalRewards } from '../../hooks/useProposalRewards';

import { AttachRewardButton } from './AttachRewardButton';
import { ProposalRewardsForm } from './ProposalRewardsForm';

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
  const { getRewardPage } = useRewardPage();
  const { rewards: allRewards } = useRewards();
  const { getFeatureTitle } = useSpaceFeatures();
  const { navigateToSpacePath } = useCharmRouter();
  const rewards = rewardIds?.map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy) || [];
  const canCreatePendingRewards = !readOnly && !rewardIds?.length;

  const {
    createNewReward,
    closeDialog,
    newRewardErrors,
    saveForm,
    selectTemplate,
    contentUpdated,
    isDirty,
    isSavingReward,
    newPageValues,
    showReward,
    setRewardValues,
    updateNewPageValues,
    rewardValues
  } = useProposalRewards({
    assignedSubmitters,
    onSave,
    reviewers,
    requiredTemplateId,
    isProposalTemplate
  });

  function openReward(rewardId: string | null) {
    if (!rewardId) return;
    navigateToSpacePath(`/${getRewardPage(rewardId)?.path || ''}`);
  }

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
                        reward={reward}
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
                              reward={reward}
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
            <Box className='dont-print-me'>
              <AttachRewardButton createNewReward={createNewReward} variant={variant} />
            </Box>
          )}
        </Stack>
      )}
      {canCreatePendingRewards && !pendingRewards?.length && (
        <AttachRewardButton createNewReward={createNewReward} variant={variant} />
      )}

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
          <ProposalRewardsForm
            onChange={setRewardValues}
            values={rewardValues}
            isNewReward
            readOnly={readOnly}
            isTemplate={false}
            expandedByDefault
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
