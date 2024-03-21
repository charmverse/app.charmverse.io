import CardDetailProperties from 'components/common/DatabaseEditor/components/cardDetail/cardDetailProperties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersLite } from 'lib/proposals/getProposals';
import type { ProposalFields } from 'lib/proposals/interfaces';

import { usePropertiesMutator } from '../hooks/usePropertiesMutator';
import { useProposalsBoardAdapter, mapProposalToCardPage } from '../hooks/useProposalsBoardAdapter';

type Props = {
  proposalForm: { createdAt: string; fields: ProposalFields | null; id?: string };
  onChange?: (properties: ProposalFields['properties']) => void;
  readOnly?: boolean;
  readOnlyProperties?: string[];
  proposalId?: string;
};

export type BoardProposal = { createdAt: string; spaceId?: string; id: string; fields: ProposalFields | null };

export function CustomPropertiesAdapter({ onChange, readOnly, readOnlyProperties, proposalId, proposalForm }: Props) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const { space } = useCurrentSpace();

  const { boardCustomProperties, cards, activeView, proposalsMap, views } = useProposalsBoardAdapter();

  const proposalFromDb = (proposalId && proposalsMap[proposalId]) || undefined;

  const proposal: ProposalWithUsersLite = {
    authors: [],
    currentStep: { title: '', step: 'draft', id: '', index: 0, result: 'in_progress' },
    reviewers: [],
    evaluations: [],
    id: '',
    pageId: '',
    title: '',
    createdAt: '',
    createdBy: '',
    updatedAt: proposalForm?.createdAt || '',
    updatedBy: '',
    ...proposalFromDb,
    fields: {
      ...proposalFromDb?.fields,
      ...proposalForm?.fields,
      properties: {
        ...proposalFromDb?.fields?.properties,
        ...proposalForm?.fields?.properties
      }
    },
    rewardIds: []
  };
  const mutator = usePropertiesMutator({ proposal, onChange });
  const { card } = mapProposalToCardPage({ proposal, spaceId: space?.id });

  return (
    <CardDetailProperties
      board={boardCustomProperties}
      card={card}
      cards={cards}
      activeView={activeView}
      views={views}
      readOnly={!!readOnly}
      pageUpdatedAt={proposal.updatedAt.toString() || new Date().toString()}
      pageUpdatedBy={proposal.updatedBy || user?.id || ''}
      mutator={mutator ?? undefined}
      readOnlyProperties={readOnlyProperties}
      disableEditPropertyOption={!isAdmin}
      boardType='proposals'
    />
  );
}
