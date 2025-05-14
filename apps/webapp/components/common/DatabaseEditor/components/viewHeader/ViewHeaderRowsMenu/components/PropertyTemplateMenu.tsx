import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { Box } from '@mui/material';
import type { Board, IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { Card, CardPropertyValue } from '@packages/databases/card';
import mutator from '@packages/databases/mutator';
import type { ProposalWithUsersLite } from '@packages/lib/proposals/getProposals';
import {
  DUE_DATE_ID,
  REWARD_AMOUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_TOKEN
} from '@packages/lib/rewards/blocks/constants';
import { getRewardType } from '@packages/lib/rewards/getRewardType';
import type { RewardReviewer, RewardTokenDetails } from '@packages/lib/rewards/interfaces';
import type { DateTime } from 'luxon';

import { ControlledProposalStatusSelect } from 'components/proposals/components/ProposalStatusSelect';
import { ControlledProposalStepSelect } from 'components/proposals/components/ProposalStepSelect';
import { RewardTokenDialog } from 'components/rewards/components/RewardProperties/components/RewardTokenDialog';
import { allMembersSystemRole, authorSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';

import { RelationPropertyPagesAutocomplete } from '../../../properties/RelationPropertyPagesAutocomplete';
import { TokenAmount } from '../../../properties/tokenAmount/tokenAmount';
import { TokenChain } from '../../../properties/tokenChain/tokenChain';
import { UserAndRoleSelect } from '../../../properties/UserAndRoleSelect';
import type { SelectOption } from '../../../properties/UserAndRoleSelect';

import { DatePropertyTemplateMenu } from './DatePropertyTemplateMenu';
import { PersonPropertyTemplateMenu } from './PersonPropertyTemplateMenu';
import { PropertyMenu, StyledMenuItem } from './PropertyMenu';
import { RewardCustomValuePropertyTemplateMenu } from './RewardCustomValuePropertyTemplateMenu';
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
  onChangeProposalsStatuses?: (pageIds: string[], result: ProposalEvaluationResult | null) => Promise<void>;
  onChangeRewardsDueDate?: (pageIds: string[], dueDate: DateTime | null) => Promise<void>;
  onChangeRewardsReviewers?: (pageIds: string[], options: SelectOption[]) => Promise<void>;
  onChangeRewardsToken?: (rewardToken: RewardTokenDetails | null) => Promise<void>;
  onChangeCustomRewardsValue?: (customReward: string) => Promise<void>;
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
  onChangeRewardsReviewers,
  onChangeRewardsToken,
  onChangeCustomRewardsValue,
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
      if (propertyTemplate.id === REWARD_REVIEWERS_BLOCK_ID) {
        const reviewerOptions = ((propertyValue as RewardReviewer[]) ?? []).map(
          (reviewer) =>
            ({
              group: reviewer.roleId ? 'role' : 'user',
              id: reviewer.roleId ?? reviewer.userId
            }) as SelectOption
        );
        return (
          <PropertyMenu lastChild={lastChild} disabledTooltip={disabledTooltip} propertyTemplate={propertyTemplate}>
            <UserAndRoleSelect
              onChange={async (options) => {
                await onChangeRewardsReviewers?.(checkedIds, options);
                if (onChange) {
                  onChange();
                }
              }}
              value={reviewerOptions}
            />
          </PropertyMenu>
        );
      }
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
            onAccept={async (value) => {
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
              displayType='table'
              onChange={(pageListItemIds) => {
                onRelationPropertyChange({
                  checkedCards,
                  pageListItemIds,
                  propertyTemplate
                });
              }}
              propertyTemplate={propertyTemplate}
              value={propertyValue as string[]}
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
                  hasCredentials: !!firstCheckedProposal.selectedCredentialTemplates.length,
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

    case 'tokenAmount':
    case 'tokenChain': {
      const firstTokenRewardCard = checkedCards.find((card) => card.fields.properties[REWARD_TOKEN]);
      if (!firstTokenRewardCard) {
        return null;
      }

      const symbolOrAddress = firstTokenRewardCard.fields.properties[REWARD_TOKEN] as string;
      const chainId = firstTokenRewardCard.fields.properties[REWARD_CHAIN] as string;
      const rewardAmount = firstTokenRewardCard.fields.properties[REWARD_AMOUNT] as number;
      const _rewardOnly =
        getRewardType({
          chainId: Number(chainId),
          rewardAmount,
          rewardToken: symbolOrAddress
        }) !== 'token';

      return (
        <PropertyMenu lastChild={lastChild} disabledTooltip={disabledTooltip} propertyTemplate={propertyTemplate}>
          <Box display='flex' px='4px'>
            <RewardTokenDialog
              readOnly={_rewardOnly}
              readOnlyToken={_rewardOnly}
              requireTokenAmount
              currentReward={{
                chainId: Number(chainId),
                rewardAmount,
                rewardToken: symbolOrAddress
              }}
              onChange={(rewardToken) => {
                onChangeRewardsToken?.(rewardToken);
                if (onChange) {
                  onChange();
                }
              }}
            >
              {propertyTemplate.type === 'tokenAmount' ? (
                <TokenAmount amount={rewardAmount} chainId={chainId} symbolOrAddress={symbolOrAddress} />
              ) : (
                <TokenChain chainId={chainId} symbolOrAddress={symbolOrAddress} />
              )}
            </RewardTokenDialog>
          </Box>
        </PropertyMenu>
      );
    }

    default: {
      if (propertyTemplate.id === REWARD_CUSTOM_VALUE) {
        return (
          <RewardCustomValuePropertyTemplateMenu
            lastChild={lastChild}
            cards={checkedCards}
            propertyTemplate={propertyTemplate}
            onChange={onChangeCustomRewardsValue ?? ((() => {}) as any)}
          />
        );
      }
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
