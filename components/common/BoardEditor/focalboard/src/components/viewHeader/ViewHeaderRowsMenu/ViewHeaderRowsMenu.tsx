import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Stack, Tooltip, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useSyncRelationPropertyValue } from 'charmClient/hooks/blocks';
import { useTrashPages } from 'charmClient/hooks/pages';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card, CardPropertyValue } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import type { CreateEventPayload } from 'lib/notifications/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import mutator from '../../../mutator';

import { ArchiveProposals } from './components/ArchiveProposals';
import { StyledMenuItem } from './components/PropertyMenu';
import type { PropertyTemplateMenuProps } from './components/PropertyTemplateMenu';
import { PropertyTemplateMenu } from './components/PropertyTemplateMenu';

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
  'relation'
] as PropertyType[];

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
  onArchiveProposals?: (archived: boolean) => void;
  onChange?: VoidFunction;
  onChangeProposalsAuthors?: PropertyTemplateMenuProps['onChangeProposalsAuthors'];
  onChangeProposalsReviewers?: PropertyTemplateMenuProps['onChangeProposalsReviewers'];
  onChangeProposalsStatuses?: PropertyTemplateMenuProps['onChangeProposalsStatuses'];
  onChangeProposalsSteps?: PropertyTemplateMenuProps['onChangeProposalsSteps'];
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
  onArchiveProposals,
  onChange,
  onChangeProposalsAuthors,
  onChangeProposalsReviewers,
  onChangeProposalsStatuses,
  onChangeProposalsSteps
}: ViewHeaderRowsMenuProps) {
  const isAdmin = useIsAdmin();
  const { space } = useCurrentSpace();
  const [isDeleting, setIsDeleting] = useState(false);
  const { trigger: trashPages } = useTrashPages();
  const { showConfirmation } = useConfirmationModal();
  const { showError } = useSnackbar();
  const { trigger: syncRelationPropertyValue } = useSyncRelationPropertyValue();

  const showTrashIcon = !board.fields.sourceType; // dont allow deleting cards for proposals-as-a-source

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
              } as CreateEventPayload)
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
        propertyTemplate.id !== Constants.titleColumnId
    );
  }, [propertyTemplates]);

  if (!space) {
    return null;
  }

  return (
    <StyledStack className='disable-drag-selection'>
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
              onPersonPropertyChange={onPersonPropertyChange}
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
