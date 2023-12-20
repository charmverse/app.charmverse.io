import { useEffect } from 'react';

import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { usePropertiesMutator } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/usePropertiesMutator';
import { useProposalsBoardAdapter } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalFieldsProp, ProposalPropertiesField } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFieldsProp;
  onChange?: (properties: ProposalPropertiesField) => void;
  readOnly?: boolean;
  readOnlyProperties?: string[];
};

export function CustomPropertiesAdapter({ proposal, onChange, readOnly, readOnlyProperties }: Props) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();

  // TODO - use value from context instead of raw hook
  const { boardCustomProperties, card, cards, activeView, views, proposalPage, setBoardProposal } =
    useProposalsBoardAdapter();
  const mutator = usePropertiesMutator({ proposal, onChange });

  useEffect(() => {
    setBoardProposal(proposal);
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
