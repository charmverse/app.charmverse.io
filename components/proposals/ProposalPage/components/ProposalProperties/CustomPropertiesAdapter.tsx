import { useEffect } from 'react';

import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalFields } from 'lib/proposal/interface';

import { usePropertiesMutator } from './hooks/usePropertiesMutator';
import { useProposalsBoardAdapter } from './hooks/useProposalsBoardAdapter';

type Props = {
  proposal: { fields: ProposalFields | null; id?: string };
  onChange?: (properties: ProposalFields['properties']) => void;
  readOnly?: boolean;
  readOnlyProperties?: string[];
  proposalId?: string;
};

export function CustomPropertiesAdapter({ proposal, onChange, readOnly, readOnlyProperties, proposalId }: Props) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();

  // TODO - use value from context instead of raw hook
  const { boardCustomProperties, card, cards, activeView, views, proposalPage, setBoardProposal } =
    useProposalsBoardAdapter();
  const mutator = usePropertiesMutator({ proposal, onChange });

  useEffect(() => {
    setBoardProposal({
      ...proposal,
      id: proposal.id ?? proposalId
    });
  }, [proposal]);

  return (
    <CardDetailProperties
      board={boardCustomProperties}
      card={card}
      cards={cards}
      activeView={activeView}
      views={views}
      readOnly={!!readOnly}
      pageUpdatedAt={proposalPage?.updatedAt.toString() || new Date().toString()}
      pageUpdatedBy={proposalPage?.updatedBy || user?.id || ''}
      mutator={mutator ?? undefined}
      readOnlyProperties={readOnlyProperties}
      disableEditPropertyOption={!isAdmin}
    />
  );
}
