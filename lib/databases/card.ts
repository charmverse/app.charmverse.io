import type { PageMeta } from '@charmverse/core/pages';

import type { Block } from 'lib/databases/block';
import { createBlock } from 'lib/databases/block';
import type { ProposalWithUsersLite } from 'lib/proposals/getProposals';
import type { ProposalEvaluationStatus } from 'lib/proposals/interfaces';
import type { RewardType } from 'lib/rewards/interfaces';

export type CardPropertyValue = string | string[] | number;

export type CardFields<V = CardPropertyValue> = {
  icon?: string;
  isTemplate?: boolean;
  properties: Record<string, V | CardPropertyValue>;
  contentOrder: (string | string[])[];
};

export type Card<V = CardPropertyValue> = Block & {
  fields: CardFields<V>;
  customIconType?: 'applicationStatus' | 'reward';
};

export type CardPageProposal = {
  currentEvaluationId?: string;
  id: string;
  status: ProposalEvaluationStatus;
  currentStep: ProposalWithUsersLite['currentStep'];
  sourceTemplateId?: string;
  evaluations: ProposalWithUsersLite['evaluations'];
  hasRewards: boolean;
  archived: boolean;
};

export type CardPageReward = {
  id: string;
  rewardType: RewardType;
};

export type CardPage<V = CardPropertyValue> = {
  subPages?: CardPage<V>[];
  card: Card<V>;
  page: Pick<
    PageMeta,
    | 'hasContent'
    | 'icon'
    | 'id'
    | 'path'
    | 'title'
    | 'bountyId'
    | 'proposalId'
    | 'syncWithPageId'
    | 'type'
    | 'updatedAt'
    | 'updatedBy'
  >;
  proposal?: CardPageProposal;
  reward?: CardPageReward;
  isStructuredProposal?: boolean;
};

export function createCard(block?: Partial<Block>): Card {
  const contentOrder: (string | string[])[] = [];
  const contentIds = block?.fields?.contentOrder?.filter((id: any) => id !== null);

  if (contentIds?.length > 0) {
    for (const contentId of contentIds) {
      if (typeof contentId === 'string') {
        contentOrder.push(contentId);
      } else {
        contentOrder.push(contentId.slice());
      }
    }
  }
  return {
    ...createBlock(block),
    type: 'card',
    fields: {
      icon: block?.fields?.icon || '',
      properties: { ...(block?.fields?.properties || {}) },
      contentOrder,
      isTemplate: block?.fields?.isTemplate || false,
      headerImage: block?.fields?.headerImage || null
    }
  };
}
