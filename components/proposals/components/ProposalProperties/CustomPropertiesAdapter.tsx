import { useEffect } from 'react';

import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { usePropertiesMutator } from 'components/proposals/components/ProposalProperties/hooks/usePropertiesMutator';
import { useProposalsBoardAdapter } from 'components/proposals/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { useUser } from 'hooks/useUser';
import type { ProposalFieldsProp, ProposalPropertiesField } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFieldsProp;
  onChange?: (properties: ProposalPropertiesField) => void;
  readOnly?: boolean;
};

export function CustomPropertiesAdapter({ proposal, onChange, readOnly }: Props) {
  const { user } = useUser();
  // TODO - use value from context instead of raw hook
  const { board, card, cards, activeView, views, proposalPage, setBoardProposal } = useProposalsBoardAdapter();
  const mutator = usePropertiesMutator({ proposal, onChange });

  useEffect(() => {
    setBoardProposal(proposal);
  }, [proposal]);

  return (
    <CardDetailProperties
      board={board}
      card={card}
      cards={cards}
      activeView={activeView}
      views={views}
      readOnly={!!readOnly}
      pageUpdatedAt={proposalPage?.updatedAt.toString() || new Date().toString()}
      pageUpdatedBy={proposalPage?.updatedBy || user?.id || ''}
      mutator={mutator ?? undefined}
    />
  );
}
