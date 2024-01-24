import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';

import { RelationPropertyPagesAutocomplete } from 'components/common/BoardEditor/components/properties/RelationPropertyPagesAutocomplete';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import type { PageListItem } from 'components/common/PagesList';
import { ControlledProposalStatusSelect } from 'components/proposals/components/ProposalStatusSelect';
import { ControlledProposalStepSelect } from 'components/proposals/components/ProposalStepSelect';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card, CardPropertyValue } from 'lib/focalboard/card';
import type { ProposalWithUsersLite } from 'lib/proposal/interface';
import { isTruthy } from 'lib/utilities/types';

import mutator from '../../../mutator';

import { DatePropertyTemplateMenu } from './DatePropertyTemplateMenu';
import { PersonPropertyTemplateMenu } from './PersonPropertyTemplateMenu';
import { PropertyMenu, StyledMenuItem } from './PropertyMenu';
import { SelectPropertyTemplateMenu } from './SelectPropertyTemplateMenu';
import { TextPropertyTemplateMenu } from './TextPropertyTemplateMenu';

export function PropertyTemplateMenu({
  propertyTemplate,
  cards,
  checkedIds,
  board,
  onChange,
  isAdmin,
  onProposalAuthorSelect,
  onProposalReviewerSelect,
  onProposalStepUpdate,
  onProposalStatusUpdate,
  onPersonPropertyChange,
  firstCheckedProposal,
  disabledTooltip,
  lastChild,
  relationPropertyCards
}: {
  relationPropertyCards: PageListItem[];
  board: Board;
  checkedIds: string[];
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
  isAdmin: boolean;
  onProposalAuthorSelect: (pageIds: string[], userIds: string[]) => Promise<void>;
  onProposalReviewerSelect: (pageIds: string[], options: SelectOption[]) => Promise<void>;
  onProposalStepUpdate(pageIds: string[], evaluationId: string, moveForward: boolean): Promise<void>;
  onProposalStatusUpdate(pageIds: string[], result: ProposalEvaluationResult | null): Promise<void>;
  onPersonPropertyChange: (a: {
    checkedCards: Card[];
    propertyTemplate: IPropertyTemplate;
    userIds: string[];
    propertyValue: CardPropertyValue;
  }) => Promise<void>;
  firstCheckedProposal?: ProposalWithUsersLite;
  disabledTooltip?: string;
  lastChild: boolean;
}) {
  const checkedCards = cards.filter((card) => checkedIds.includes(card.id));
  const { showError } = useSnackbar();

  if (checkedCards.length === 0) {
    return null;
  }

  const propertyValue = checkedCards[0].fields.properties[propertyTemplate.id];

  switch (propertyTemplate.type) {
    case 'checkbox': {
      return (
        <StyledMenuItem
          lastChild={lastChild}
          onClick={async () => {
            await mutator.changePropertyValues(
              checkedCards,
              propertyTemplate.id,
              (!(propertyValue === 'true')).toString()
            );
            onChange?.();
          }}
        >
          {propertyTemplate.name}
        </StyledMenuItem>
      );
    }
    case 'select':
    case 'multiSelect': {
      return (
        <SelectPropertyTemplateMenu
          lastChild={lastChild}
          onChange={onChange}
          board={board}
          cards={checkedCards}
          propertyTemplate={propertyTemplate}
        />
      );
    }

    case 'relation': {
      const pageListItemsRecord =
        relationPropertyCards.reduce<Record<string, PageListItem>>((acc, pageListItem) => {
          acc[pageListItem.id] = pageListItem;
          return acc;
        }, {}) ?? {};

      return (
        <PropertyMenu lastChild={lastChild} cards={cards} propertyTemplate={propertyTemplate}>
          <Box
            sx={{
              minWidth: 100,
              minHeight: 25
            }}
          >
            <RelationPropertyPagesAutocomplete
              relationLimit={propertyTemplate.relationData?.limit ?? 'single_page'}
              onChange={async (newValue) => {
                try {
                  await mutator.changePropertyValues(checkedCards, propertyTemplate.id, newValue);
                } catch (error) {
                  showError(error);
                }
              }}
              selectedPageListItems={(Array.isArray(propertyValue)
                ? propertyValue.map((pageListItemId) => pageListItemsRecord[pageListItemId])
                : []
              ).filter(isTruthy)}
              pageListItems={relationPropertyCards ?? []}
            />
          </Box>
        </PropertyMenu>
      );
    }

    case 'person': {
      return (
        <PersonPropertyTemplateMenu
          lastChild={lastChild}
          onChange={async (userIds) => {
            await onPersonPropertyChange({
              checkedCards,
              propertyTemplate,
              propertyValue,
              userIds
            });
            if (onChange) {
              onChange();
            }
          }}
          cards={checkedCards}
          propertyTemplate={propertyTemplate}
        />
      );
    }

    case 'proposalAuthor': {
      if (!isAdmin) {
        return null;
      }
      return (
        <PersonPropertyTemplateMenu
          lastChild={lastChild}
          onChange={async (userIds) => {
            await onProposalAuthorSelect(checkedIds, userIds);
            if (onChange) {
              onChange();
            }
          }}
          cards={checkedCards}
          propertyTemplate={propertyTemplate}
        />
      );
    }

    case 'proposalReviewer': {
      if (!isAdmin) {
        return null;
      }

      return (
        <PropertyMenu
          lastChild={lastChild}
          disabledTooltip={disabledTooltip}
          cards={cards}
          propertyTemplate={propertyTemplate}
        >
          {({ isPropertyOpen }) =>
            isPropertyOpen ? (
              <UserAndRoleSelect
                value={propertyValue as any}
                systemRoles={[allMembersSystemRole]}
                onChange={async (options) => {
                  await onProposalReviewerSelect(checkedIds, options);
                  if (onChange) {
                    onChange();
                  }
                }}
                required
              />
            ) : (
              <UserAndRoleSelect
                onChange={() => {}}
                value={propertyValue as any}
                systemRoles={[allMembersSystemRole]}
                readOnly
                required
              />
            )
          }
        </PropertyMenu>
      );
    }

    case 'date': {
      return (
        <DatePropertyTemplateMenu
          lastChild={lastChild}
          onChange={onChange}
          cards={checkedCards}
          propertyTemplate={propertyTemplate}
        />
      );
    }

    case 'proposalStatus': {
      if (firstCheckedProposal) {
        return (
          <PropertyMenu
            lastChild={lastChild}
            cards={cards}
            disabledTooltip={disabledTooltip}
            propertyTemplate={propertyTemplate}
          >
            <ControlledProposalStatusSelect
              onChange={(result) => onProposalStatusUpdate(checkedIds, result)}
              proposal={firstCheckedProposal}
            />
          </PropertyMenu>
        );
      }
      return null;
    }

    case 'proposalStep': {
      if (firstCheckedProposal) {
        return (
          <PropertyMenu
            lastChild={lastChild}
            disabledTooltip={disabledTooltip}
            cards={cards}
            propertyTemplate={propertyTemplate}
          >
            <ControlledProposalStepSelect
              onChange={({ evaluationId, moveForward }) => onProposalStepUpdate(checkedIds, evaluationId, moveForward)}
              proposal={{
                archived: firstCheckedProposal.archived ?? false,
                currentStep: firstCheckedProposal.currentStep,
                id: firstCheckedProposal.id,
                evaluations: firstCheckedProposal.evaluations,
                currentEvaluationId: firstCheckedProposal.currentEvaluationId,
                hasRewards:
                  (firstCheckedProposal.rewardIds ?? []).length > 0 ||
                  (firstCheckedProposal.fields?.pendingRewards ?? []).length > 0
              }}
            />
          </PropertyMenu>
        );
      }
      return null;
    }

    default: {
      return (
        <TextPropertyTemplateMenu
          lastChild={lastChild}
          onChange={onChange}
          cards={checkedCards}
          propertyTemplate={propertyTemplate}
        />
      );
    }
  }
}
