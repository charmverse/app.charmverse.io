import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Stack, Tooltip, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';

import charmClient from 'charmClient';
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

import { StyledMenuItem } from './PropertyMenu';
import type { PropertyTemplateMenuProps } from './PropertyTemplateMenu';
import { PropertyTemplateMenu } from './PropertyTemplateMenu';

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
  'proposalStatus'
] as PropertyType[];

export type ViewHeaderRowsMenuProps = {
  board: Board;
  cards: Card[];
  setCheckedIds: Dispatch<SetStateAction<string[]>>;
  checkedIds: string[];
  propertyTemplates: IPropertyTemplate<PropertyType>[];
  onChange?: VoidFunction;
  onProposalAuthorSelect: PropertyTemplateMenuProps['onProposalAuthorSelect'];
  onProposalReviewerSelect: PropertyTemplateMenuProps['onProposalReviewerSelect'];
  onProposalStatusUpdate: PropertyTemplateMenuProps['onProposalStatusUpdate'];
  onProposalStepUpdate: PropertyTemplateMenuProps['onProposalStepUpdate'];
  isStepDisabled?: boolean;
  isStatusDisabled?: boolean;
  isReviewersDisabled?: boolean;
  firstCheckedProposal?: PropertyTemplateMenuProps['firstCheckedProposal'];
};

export function ViewHeaderRowsMenu({
  cards,
  checkedIds,
  setCheckedIds,
  board,
  propertyTemplates,
  onChange,
  onProposalAuthorSelect,
  onProposalReviewerSelect,
  onProposalStatusUpdate,
  onProposalStepUpdate,
  isStepDisabled,
  isStatusDisabled,
  isReviewersDisabled,
  firstCheckedProposal
}: ViewHeaderRowsMenuProps) {
  const isAdmin = useIsAdmin();
  const { space } = useCurrentSpace();
  const [isDeleting, setIsDeleting] = useState(false);
  const { trigger: trashPages } = useTrashPages();
  const { showConfirmation } = useConfirmationModal();
  const { showError } = useSnackbar();

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
      showError(error, 'There was an error updating properties');
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
              checkedIds={checkedIds}
              cards={cards}
              propertyTemplate={propertyTemplate}
              key={propertyTemplate.id}
              onChange={onChange}
              firstCheckedProposal={firstCheckedProposal}
              onProposalAuthorSelect={onProposalAuthorSelect}
              onProposalReviewerSelect={onProposalReviewerSelect}
              onProposalStatusUpdate={onProposalStatusUpdate}
              onProposalStepUpdate={onProposalStepUpdate}
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
