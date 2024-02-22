import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { Box } from '@mui/material';
import type { DateTime } from 'luxon';

import { RelationPropertyPagesAutocomplete } from 'components/common/BoardEditor/components/properties/RelationPropertyPagesAutocomplete';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { ControlledProposalStatusSelect } from 'components/proposals/components/ProposalStatusSelect';
import { ControlledProposalStepSelect } from 'components/proposals/components/ProposalStepSelect';
import { allMembersSystemRole, authorSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card, CardPropertyValue } from 'lib/focalboard/card';
import type { ProposalWithUsersLite } from 'lib/proposal/getProposals';
import { DUE_DATE_ID } from 'lib/rewards/blocks/constants';

import mutator from '../../../../mutator';

import { DatePropertyTemplateMenu } from './DatePropertyTemplateMenu';
import { PersonPropertyTemplateMenu } from './PersonPropertyTemplateMenu';
import { PropertyMenu, StyledMenuItem } from './PropertyMenu';
import { RewardsDueDatePropertyTemplateMenu } from './RewardsDueDatePropertyTemplateMenu';
import { SelectPropertyTemplateMenu } from './SelectPropertyTemplateMenu';
import { TextPropertyTemplateMenu } from './TextPropertyTemplateMenu';

export type PropertyTemplateMenuProps = {
  board: Board;
  checkedIds: string[];
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
  isAdmin: boolean;
  onChangeProposalsAuthors?: (pageIds: string[], userIds: string[]) => Promise<void>;
  onChangeProposalsReviewers?: (pageIds: string[], options: SelectOption[]) => Promise<void>;
  onChangeProposalsSteps?: (pageIds: string[], evaluationId: string, moveForward: boolean) => Promise<void>;
  onChangeRewardsDueDate?: (pageIds: string[], dueDate: DateTime | null) => Promise<void>;
  onChangeProposalsStatuses?: (pageIds: string[], result: ProposalEvaluationResult | null) => Promise<void>;
  onRelationPropertyChange: (a: {
    checkedCards: Card[];
    pageListItemIds: string[];
    propertyTemplate: IPropertyTemplate;
  }) => Promise<void>;
  onPersonPropertyChange: (a: {
    checkedCards: Card[];
    propertyTemplate: IPropertyTemplate;
    userIds: string[];
    propertyValue: CardPropertyValue;
  }) => Promise<void>;
  firstCheckedProposal?: ProposalWithUsersLite;
  disabledTooltip?: string;
  lastChild: boolean;
};

export function PropertyTemplateMenu({
  propertyTemplate,
  cards,
  checkedIds,
  board,
  onChange,
  isAdmin,
  onChangeProposalsAuthors,
  onChangeProposalsReviewers,
  onChangeProposalsSteps,
  onChangeProposalsStatuses,
  onPersonPropertyChange,
  onRelationPropertyChange,
  onChangeRewardsDueDate,
  firstCheckedProposal,
  disabledTooltip,
  lastChild
}: PropertyTemplateMenuProps) {
  const checkedCards = cards.filter((card) => checkedIds.includes(card.id));

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
            await onChangeProposalsAuthors?.(checkedIds, userIds);
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
        <PropertyMenu lastChild={lastChild} disabledTooltip={disabledTooltip} propertyTemplate={propertyTemplate}>
          {({ isPropertyOpen }) => (
            <Box display='flex' py='2px' px='4px'>
              {isPropertyOpen ? (
                <UserAndRoleSelect
                  value={propertyValue as any}
                  systemRoles={[allMembersSystemRole, authorSystemRole]}
                  onChange={async (options) => {
                    await onChangeProposalsReviewers?.(checkedIds, options);
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
              )}
            </Box>
          )}
        </PropertyMenu>
      );
    }

    case 'date': {
      if (propertyTemplate.id === DUE_DATE_ID) {
        return (
          <RewardsDueDatePropertyTemplateMenu
            cards={checkedCards}
            lastChild={lastChild}
            propertyTemplate={propertyTemplate}
            onChange={async (value) => {
              await onChangeRewardsDueDate?.(checkedIds, value);
              if (onChange) {
                onChange();
              }
            }}
          />
        );
      }
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
          <PropertyMenu lastChild={lastChild} disabledTooltip={disabledTooltip} propertyTemplate={propertyTemplate}>
            <Box display='flex' py='2px' px='4px'>
              <ControlledProposalStatusSelect
                onChange={(result) => onChangeProposalsStatuses?.(checkedIds, result)}
                proposal={firstCheckedProposal}
              />
            </Box>
          </PropertyMenu>
        );
      }
      return null;
    }

    case 'relation': {
      return (
        <PropertyMenu lastChild={lastChild} disabledTooltip={disabledTooltip} propertyTemplate={propertyTemplate}>
          <Box px={1}>
            <RelationPropertyPagesAutocomplete
              boardProperties={board.fields.cardProperties}
              displayType='table'
              onChange={(pageListItemIds) => {
                onRelationPropertyChange({
                  checkedCards,
                  pageListItemIds,
                  propertyTemplate
                });
              }}
              propertyTemplate={propertyTemplate}
              selectedPageListItemIds={(propertyValue ?? []) as string[]}
              wrapColumn={false}
            />
          </Box>
        </PropertyMenu>
      );
    }

    case 'proposalStep': {
      if (firstCheckedProposal) {
        return (
          <PropertyMenu lastChild={lastChild} disabledTooltip={disabledTooltip} propertyTemplate={propertyTemplate}>
            <Box display='flex' py='2px' px='4px'>
              <ControlledProposalStepSelect
                onChange={({ evaluationId, moveForward }) =>
                  onChangeProposalsSteps?.(checkedIds, evaluationId, moveForward)
                }
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
            </Box>
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
