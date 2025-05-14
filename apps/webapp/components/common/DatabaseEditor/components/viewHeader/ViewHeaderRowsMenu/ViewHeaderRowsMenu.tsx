import styled from '@emotion/styled';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import type { SxProps } from '@mui/material';
import { ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import type { Board, IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { Card, CardPropertyValue } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import mutator from '@packages/databases/mutator';
import type { CreateEventPayload } from '@packages/lib/notifications/interfaces';
import {
  APPLICANT_BLOCK_ID,
  REWARDS_APPLICANTS_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  REWARD_APPLICANTS_COUNT,
  REWARD_PROPOSAL_LINK,
  REWARD_STATUS_BLOCK_ID
} from '@packages/lib/rewards/blocks/constants';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import dynamic from 'next/dynamic';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useSyncRelationPropertyValue } from 'charmClient/hooks/blocks';
import { useTrashPages } from 'charmClient/hooks/pages';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';

import { ArchiveProposals } from './components/ArchiveProposals';
import { BatchPaymentRewards } from './components/BatchPaymentRewards';
import { IssueProposalCredentials } from './components/IssueProposalCredentials';
import { StyledMenuItem } from './components/PropertyMenu';
import type { PropertyTemplateMenuProps } from './components/PropertyTemplateMenu';
import { PropertyTemplateMenu } from './components/PropertyTemplateMenu';

const IssueRewardCredentials = dynamic(() =>
  import('./components/IssueRewardCredentials').then((mod) => mod.IssueRewardCredentials)
);
const StyledStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  z-index: 1;
  overflow: auto;
  width: 100%;
  margin-right: 8px;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const validPropertyTypes = [
  'checkbox',
  'text',
  'number',
  'date',
  'multiSelect',
  'select',
  'url',
  'email',
  'phone',
  'person',
  'proposalAuthor',
  'proposalReviewer',
  'proposalStep',
  'proposalStatus',
  'relation',
  'tokenAmount',
  'tokenChain'
] as PropertyType[];

const invalidPropertyIds = [
  REWARD_APPLICANTS_COUNT,
  REWARD_PROPOSAL_LINK,
  REWARDS_APPLICANTS_BLOCK_ID,
  APPLICANT_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID
];

export type ViewHeaderRowsMenuProps = {
  board: Board;
  cards: Card[];
  setCheckedIds: Dispatch<SetStateAction<string[]>>;
  checkedIds: string[];
  propertyTemplates: IPropertyTemplate<PropertyType>[];
  // below are special props used by proposals table
  firstCheckedProposal?: PropertyTemplateMenuProps['firstCheckedProposal'];
  isStepDisabled?: boolean;
  isStatusDisabled?: boolean;
  isReviewersDisabled?: boolean;
  isMarkPaidDisabled?: boolean;
  isMarkCompleteDisabled?: boolean;
  onArchiveProposals?: (archived: boolean) => void;
  onChange?: VoidFunction;
  onChangeProposalsAuthors?: PropertyTemplateMenuProps['onChangeProposalsAuthors'];
  onChangeProposalsReviewers?: PropertyTemplateMenuProps['onChangeProposalsReviewers'];
  onChangeProposalsStatuses?: PropertyTemplateMenuProps['onChangeProposalsStatuses'];
  onChangeProposalsSteps?: PropertyTemplateMenuProps['onChangeProposalsSteps'];
  onChangeRewardsDueDate?: PropertyTemplateMenuProps['onChangeRewardsDueDate'];
  onChangeRewardsReviewers?: PropertyTemplateMenuProps['onChangeRewardsReviewers'];
  onChangeRewardsToken?: PropertyTemplateMenuProps['onChangeRewardsToken'];
  onChangeCustomRewardsValue?: PropertyTemplateMenuProps['onChangeCustomRewardsValue'];
  showIssueProposalCredentials?: boolean;
  showIssueRewardCredentials?: boolean;
  showRewardsPaymentButton?: boolean;
  showTrashIcon?: boolean;
  onMarkRewardsAsPaid?: () => Promise<void>;
  onMarkRewardsAsComplete?: () => Promise<void>;
  onIssueCredentialsSuccess?: () => void;
  sx?: SxProps;
};

export function ViewHeaderRowsMenu({
  cards,
  checkedIds,
  setCheckedIds,
  board,
  propertyTemplates,
  firstCheckedProposal,
  isStepDisabled,
  isStatusDisabled,
  isReviewersDisabled,
  isMarkPaidDisabled,
  isMarkCompleteDisabled,
  onChangeCustomRewardsValue,
  onArchiveProposals,
  onChange,
  onChangeProposalsAuthors,
  onChangeProposalsReviewers,
  onChangeProposalsStatuses,
  onChangeProposalsSteps,
  onChangeRewardsDueDate,
  onChangeRewardsReviewers,
  showIssueProposalCredentials,
  showIssueRewardCredentials,
  showRewardsPaymentButton,
  showTrashIcon = !board.fields.sourceType,
  onMarkRewardsAsComplete,
  onMarkRewardsAsPaid,
  onChangeRewardsToken,
  onIssueCredentialsSuccess,
  sx
}: ViewHeaderRowsMenuProps) {
  const isAdmin = useIsAdmin();
  const { space } = useCurrentSpace();
  const [isDeleting, setIsDeleting] = useState(false);
  const { trigger: trashPages } = useTrashPages();
  const { showConfirmation } = useConfirmationModal();
  const { showError } = useSnackbar();
  const { trigger: syncRelationPropertyValue } = useSyncRelationPropertyValue();

  async function deleteCheckedCards() {
    if (checkedIds.length > 1) {
      const { confirmed } = await showConfirmation({
        message: `Are you sure you want to delete ${checkedIds.length} cards?`,
        confirmButton: 'Delete'
      });
      if (!confirmed) {
        return;
      }
    }
    setIsDeleting(true);
    try {
      await trashPages({ pageIds: checkedIds, trash: true });
    } catch (error) {
      showError(error, 'There was an error deleting cards');
    } finally {
      setCheckedIds([]);
      setIsDeleting(false);
    }
  }

  async function onPersonPropertyChange({
    checkedCards,
    userIds,
    propertyTemplate,
    propertyValue
  }: {
    checkedCards: Card[];
    propertyTemplate: IPropertyTemplate;
    userIds: string[];
    propertyValue: CardPropertyValue;
  }) {
    try {
      await mutator.changePropertyValues(checkedCards, propertyTemplate.id, userIds);
    } catch (error) {
      showError(error, 'There was an error updating person property');
    }
    const previousValue = propertyValue
      ? typeof propertyValue === 'string'
        ? [propertyValue]
        : (propertyValue as string[])
      : [];
    const newUserIds = userIds.filter((id) => !previousValue.includes(id));
    charmClient.createEvents({
      spaceId: board.spaceId,
      payload: newUserIds
        .map((userId) =>
          checkedCards.map(
            (card) =>
              ({
                cardId: card.id,
                cardProperty: {
                  id: propertyTemplate.id,
                  name: propertyTemplate.name,
                  value: userId
                },
                scope: WebhookEventNames.CardPersonPropertyAssigned
              }) as CreateEventPayload
          )
        )
        .flat()
    });
  }

  const onRelationPropertyChange = async ({
    checkedCards,
    pageListItemIds,
    propertyTemplate
  }: {
    checkedCards: Card[];
    pageListItemIds: string[];
    propertyTemplate: IPropertyTemplate;
  }) => {
    try {
      for (const card of checkedCards) {
        await syncRelationPropertyValue({
          cardId: card.id,
          templateId: propertyTemplate.id,
          boardId: board.id,
          pageIds: pageListItemIds
        });
      }
    } catch (err) {
      showError(err, 'There was an error updating relation property');
    }
  };

  const filteredPropertyTemplates = useMemo(() => {
    return propertyTemplates.filter(
      (propertyTemplate) =>
        !propertyTemplate.formFieldId &&
        validPropertyTypes.includes(propertyTemplate.type) &&
        propertyTemplate.id !== Constants.titleColumnId &&
        !invalidPropertyIds.includes(propertyTemplate.id)
    );
  }, [propertyTemplates]);

  if (!space) {
    return null;
  }

  return (
    <StyledStack className='disable-drag-selection' sx={sx}>
      <StyledMenuItem firstChild lastChild={!showTrashIcon && filteredPropertyTemplates.length === 0}>
        <Typography onClick={() => setCheckedIds([])} color='primary' variant='body2'>
          {checkedIds.length} selected
        </Typography>
      </StyledMenuItem>

      {cards.length !== 0
        ? filteredPropertyTemplates.map((propertyTemplate, index) => (
            <PropertyTemplateMenu
              isAdmin={isAdmin}
              board={board}
              onRelationPropertyChange={onRelationPropertyChange}
              checkedIds={checkedIds}
              cards={cards}
              propertyTemplate={propertyTemplate}
              key={propertyTemplate.id}
              onChange={onChange}
              firstCheckedProposal={firstCheckedProposal}
              onChangeProposalsAuthors={onChangeProposalsAuthors}
              onChangeProposalsReviewers={onChangeProposalsReviewers}
              onChangeProposalsStatuses={onChangeProposalsStatuses}
              onChangeProposalsSteps={onChangeProposalsSteps}
              onChangeRewardsDueDate={onChangeRewardsDueDate}
              onChangeRewardsReviewers={onChangeRewardsReviewers}
              onPersonPropertyChange={onPersonPropertyChange}
              onChangeRewardsToken={onChangeRewardsToken}
              onChangeCustomRewardsValue={onChangeCustomRewardsValue}
              lastChild={!showTrashIcon && index === filteredPropertyTemplates.length - 1}
              disabledTooltip={
                propertyTemplate.type === 'proposalStep' && isStepDisabled
                  ? 'To change multiple proposals, they must use the same workflow and be in the same step'
                  : propertyTemplate.type === 'proposalStatus' && isStatusDisabled
                    ? 'To change multiple proposals, they must be in the same step'
                    : propertyTemplate.type === 'proposalReviewer' && isReviewersDisabled
                      ? `To change multiple proposal's reviewers, they must not be in draft or feedback step`
                      : undefined
              }
            />
          ))
        : null}
      {onArchiveProposals && <ArchiveProposals onChange={onArchiveProposals} />}
      {onMarkRewardsAsPaid && (
        <Tooltip
          title={
            isMarkPaidDisabled
              ? 'Selected rewards are already paid or have applications that are not in paid or complete status'
              : 'Mark selected rewards as paid'
          }
        >
          <div>
            <StyledMenuItem onClick={onMarkRewardsAsPaid} disabled={isDeleting || isMarkPaidDisabled}>
              <PaidIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
              <ListItemText primary='Mark paid' />
            </StyledMenuItem>
          </div>
        </Tooltip>
      )}
      {onMarkRewardsAsComplete && (
        <Tooltip
          title={
            isMarkCompleteDisabled ? `Selected rewards are already completed` : 'Mark selected rewards as complete'
          }
        >
          <div>
            <StyledMenuItem onClick={onMarkRewardsAsComplete} disabled={isDeleting || isMarkCompleteDisabled}>
              <CheckCircleOutlinedIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
              <ListItemText primary='Mark complete' />
            </StyledMenuItem>
          </div>
        </Tooltip>
      )}
      {showIssueProposalCredentials && (
        <IssueProposalCredentials
          asMenuItem
          selectedPageIds={checkedIds}
          onIssueCredentialsSuccess={onIssueCredentialsSuccess}
        />
      )}
      {showIssueRewardCredentials && <IssueRewardCredentials selectedPageIds={checkedIds} asMenuItem />}
      {showRewardsPaymentButton && <BatchPaymentRewards checkedIds={checkedIds} />}
      {showTrashIcon && (
        <StyledMenuItem lastChild onClick={deleteCheckedCards} disabled={isDeleting}>
          <Tooltip title='Delete'>
            <DeleteOutlinedIcon fontSize='small' />
          </Tooltip>
        </StyledMenuItem>
      )}
    </StyledStack>
  );
}
