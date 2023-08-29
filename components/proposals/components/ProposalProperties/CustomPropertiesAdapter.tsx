import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { usePropertiesMutator } from 'components/proposals/components/ProposalProperties/hooks/usePropertiesMutator';
import { useProposalsBoardAdapter } from 'components/proposals/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalFieldsProp, ProposalPropertiesField } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFieldsProp;
  onChange?: (properties: ProposalPropertiesField) => void;
  readOnly?: boolean;
};

export function CustomPropertiesAdapter({ proposal, onChange, readOnly }: Props) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const { board, card, cards, activeView, views, proposalPage } = useProposalsBoardAdapter({ proposal });
  const mutator = usePropertiesMutator({ proposal, onChange });

  return (
    <CardDetailProperties
      board={board}
      card={card}
      cards={cards}
      activeView={activeView}
      views={views}
      readOnly={!isAdmin}
      pageUpdatedAt={proposalPage?.updatedAt.toString() || new Date().toString()}
      pageUpdatedBy={proposalPage?.updatedBy || user?.id || ''}
      mutator={mutator ?? undefined}
    />
  );
}
