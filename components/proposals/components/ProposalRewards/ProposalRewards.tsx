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
import type { ProposalPendingReward } from 'lib/proposal/blocks/interfaces';
import type { RewardWithUsers } from 'lib/rewards/interfaces';

type Props = {
  pendingRewards: ProposalPendingReward[] | undefined;
  rewards: RewardWithUsers[];
  readOnly: boolean;
  onSave: (reward: ProposalPendingReward) => void;
  onDelete: (draftId: string) => void;
};

export function ProposalRewards({ pendingRewards, readOnly, onSave, onDelete, rewards }: Props) {
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);

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
                  <RewardTokenInfo
                    chainId={reward.chainId || null}
                    symbolOrAddress={reward.rewardToken || null}
                    rewardAmount={reward.rewardAmount || null}
                  />
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
