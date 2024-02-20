import type { ProposalReviewer } from '@charmverse/core/prisma';
import { Delete, Edit, Add } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Grid, Hidden, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { uniqBy } from 'lodash';
import { useState } from 'react';
import { v4 } from 'uuid';

import { SelectPreviewContainer } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import TableHeader from 'components/common/BoardEditor/focalboard/src/components/table/tableHeader';
import TableRow from 'components/common/BoardEditor/focalboard/src/components/table/tableRow';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { PageIcon } from 'components/common/PageIcon';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { RewardAmount } from 'components/rewards/components/RewardStatusBadge';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsNavigation } from 'components/rewards/hooks/useRewardsNavigation';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useRewardsBoard } from 'hooks/useRewardsBoard';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { IPropertyTemplate } from 'lib/focalboard/board';
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
  variant?: 'solid_button' | 'card_property'; // solid_button is used for form proposals
  isProposalTemplate?: boolean;
};

type RewardRow = {
  id: string;
  title: string;
  isPending: boolean;
};

const rewardQueryKey = 'rewardId';

export function ProposalRewardsTable({
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
  const { defaultView, boardBlock, isLoading } = useRewardsBoard();
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
    // set a new draftId
    setCurrentPendingId(v4());
  }

  function showRewardCard(id: string) {
    // setRewardValues(reward);
    // openNewPage(page || undefined);
    // setCurrentPendingId(draftId);
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
  const headers: IPropertyTemplate[] = [];
  const rows: RewardRow[] =
    pendingRewards?.map(({ reward, page, draftId }) => {
      return {
        id: draftId,
        title: page.title || '',
        isPending: true
      };
    }) || [];

  const loadingData = isLoading;

  return (
    <>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Box my={1}>
          <Typography variant='h5'>{getFeatureTitle('Rewards')}</Typography>
        </Box>
        <div>
          <AttachRewardButton createNewReward={createNewReward} variant={variant} />
        </div>
      </Box>
      {loadingData ? (
        <Grid item xs={12} sx={{ mt: 12 }}>
          <LoadingComponent height={500} isLoading size={50} />
        </Grid>
      ) : (
        <Box className='container-container'>
          <Stack>
            <Box width='100%'>
              <Table
                boardType='rewards'
                setSelectedPropertyId={() => {}}
                board={boardBlock!}
                activeView={defaultView}
                cardPages={[]}
                views={[]}
                visibleGroups={[]}
                selectedCardIds={[]}
                readOnly={true}
                disableAddingCards
                showCard={showRewardCard}
                readOnlyTitle
                readOnlyRows
                cardIdToFocusOnRender=''
                addCard={async () => {}}
                onCardClicked={() => {}}
                onDeleteCard={() => Promise.resolve()}
              />
            </Box>
          </Stack>
        </Box>
      )}
      <NewPageDialog
        contentUpdated={!readOnly && (contentUpdated || isDirty)}
        disabledTooltip={getDisabledTooltip({
          readOnly,
          newPageValues,
          rewardValues,
          isProposalTemplate: !!isProposalTemplate
        })}
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
