import { useEffect } from 'react';

import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { usePropertiesMutator } from 'components/proposals/components/ProposalProperties/hooks/usePropertiesMutator';
import { useProposalsBoard } from 'components/proposals/hooks/useProposalsBoard';
import { useUser } from 'hooks/useUser';
import type { ProposalFieldsProp, ProposalPropertiesField } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFieldsProp;
  onChange?: (properties: ProposalPropertiesField) => void;
  readOnly?: boolean;
};

export function CustomPropertiesAdapter({ proposal, onChange, readOnly }: Props) {
  const { user } = useUser();
  const { boardCustomProperties, card, cards, activeView, views, proposalPage, setBoardProposal } = useProposalsBoard();
  const mutator = usePropertiesMutator({ proposal, onChange });

  useEffect(() => {
    setBoardProposal(proposal);
    return () => setBoardProposal(null);
  }, [proposal, setBoardProposal]);

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
    />
  );
}
