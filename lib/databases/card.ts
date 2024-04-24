import type { UIBlockWithDetails } from 'lib/databases/block';
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

export type Card<V = CardPropertyValue> = Omit<UIBlockWithDetails, 'type'> & {
  fields: CardFields<V>;
  customIconType?: 'applicationStatus' | 'reward';
  type: 'card';
};

export type CardPageProposal = {
  currentEvaluationId?: string;
  id: string;
  status: ProposalEvaluationStatus;
  currentStep: ProposalWithUsersLite['currentStep'];
  sourceTemplateId?: string;
  evaluations: ProposalWithUsersLite['evaluations'];
  hasRewards: boolean;
  hasCredentials: boolean;
  archived: boolean;
};

export type CardPageReward = {
  id: string;
  rewardType: RewardType;
  applications: { createdBy: string }[];
};

export type CardWithRelations<V = CardPropertyValue> = Card<V> & {
  subPages?: Card<V>[];
  proposal?: CardPageProposal;
  reward?: CardPageReward;
  isStructuredProposal?: boolean;
};

export function createCard(block?: Partial<UIBlockWithDetails>): Omit<Card, 'pageId'> {
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
      ...block?.fields,
      properties: { ...(block?.fields?.properties || {}) },
      contentOrder,
      headerImage: block?.fields?.headerImage || null
    }
  };
}
