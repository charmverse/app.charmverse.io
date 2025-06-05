import type { ProposalReviewer } from '@charmverse/core/prisma';
import { Delete, Edit } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import type { ProposalPendingReward } from '@packages/lib/proposals/interfaces';
import { isTruthy } from '@packages/utils/types';

import { SelectPreviewContainer } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import { Hidden } from 'components/common/Hidden';
import Link from 'components/common/Link';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { RewardAmount } from 'components/rewards/components/RewardAmount';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

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
  const rewards = rewardIds?.map((rId) => allRewards?.find((r) => r.id === rId)).filter(isTruthy) || [];
  const canCreatePendingRewards = !readOnly && !rewardIds?.length && !isProposalTemplate;

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

  const { showPage } = usePageDialog();

  if (rewards.length) {
    return (
      <Stack gap={0.5} flex={1} width='500px' maxWidth='100%'>
        {rewards.map((reward) => {
          return (
            <Link href={`/${getRewardPage(reward.id)?.path}`} key={reward.id}>
              <Stack
                alignItems='center'
                gap={1}
                direction='row'
                sx={{
                  '&:hover .icons': {
                    opacity: 1
                  }
                }}
                flex={1}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <SelectPreviewContainer
                  displayType='details'
                  onClick={() => {
                    showPage({
                      bountyId: reward.id,
                      pageId: getRewardPage(reward.id)?.id
                    });
                  }}
                >
                  <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Typography component='span' variant='subtitle1' fontWeight='normal' color='initial'>
                      {getRewardPage(reward.id)?.title || 'Untitled'}
                    </Typography>
                    <Hidden mdDown>
                      <Stack alignItems='center' direction='row' height='100%'>
                        <RewardAmount
                          reward={reward}
                          typographyProps={{
                            color: 'initial'
                          }}
                        />
                      </Stack>
                    </Hidden>
                  </Stack>
                </SelectPreviewContainer>
              </Stack>
            </Link>
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
                      <Grid size={{ xs: 8, lg: 5 }}>
                        <Typography component='span' variant='subtitle1' fontWeight='normal'>
                          {page?.title || 'Untitled'}
                        </Typography>
                      </Grid>
                      <Hidden lgDown>
                        <Grid size={5}>
                          <Stack alignItems='center' direction='row' height='100%'>
                            <RewardAmount reward={reward} />
                          </Stack>
                        </Grid>
                      </Hidden>

                      <Grid size={{ xs: 4, lg: 2 }}>
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
          />
        </NewDocumentPage>
      </NewPageDialog>
    </>
  );
}
