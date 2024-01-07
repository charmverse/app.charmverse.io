import type { ProposalEvaluationResult } from '@charmverse/core/dist/cjs/prisma-client';

import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { ControlledProposalStatusSelect } from 'components/proposals/components/ProposalStatusSelect';
import { ControlledProposalStepSelect } from 'components/proposals/components/ProposalStepSelect';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import type { ProposalWithUsersLite } from 'lib/proposal/interface';

import mutator from '../../../mutator';

import { DatePropertyTemplateMenu } from './DatePropertyTemplateMenu';
import { PersonPropertyTemplateMenu } from './PersonPropertyTemplateMenu';
import { PropertyMenu, StyledMenuItem } from './PropertyMenu';
import { SelectPropertyTemplateMenu } from './SelectPropertyTemplateMenu';

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
  firstCheckedProposal,
  disabledTooltip
}: {
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
  firstCheckedProposal?: ProposalWithUsersLite;
  disabledTooltip?: string;
}) {
  const checkedCards = cards.filter((card) => checkedIds.includes(card.id));

  if (checkedCards.length === 0) {
    return null;
  }

  const propertyValue = checkedCards[0].fields.properties[propertyTemplate.id];

  switch (propertyTemplate.type) {
    case 'checkbox': {
      return (
        <StyledMenuItem
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
          onChange={onChange}
          board={board}
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
          onChange={async (userIds) => {
            await onProposalAuthorSelect(checkedIds, userIds);
            if (onChange) {
              onChange();
            }
          }}
          board={board}
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
        <PropertyMenu disabledTooltip={disabledTooltip} cards={cards} propertyTemplate={propertyTemplate}>
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
      return <DatePropertyTemplateMenu onChange={onChange} cards={checkedCards} propertyTemplate={propertyTemplate} />;
    }

    case 'proposalStatus': {
      if (firstCheckedProposal) {
        return (
          <PropertyMenu cards={cards} disabledTooltip={disabledTooltip} propertyTemplate={propertyTemplate}>
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
          <PropertyMenu disabledTooltip={disabledTooltip} cards={cards} propertyTemplate={propertyTemplate}>
            <ControlledProposalStepSelect
              onChange={({ evaluationId, moveForward }) => onProposalStepUpdate(checkedIds, evaluationId, moveForward)}
              proposal={{
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
      return null;
    }
  }
}
