import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { usePropertiesMutator } from 'components/proposals/components/ProposalProperties/hooks/usePropertiesMutator';
import { useProposalsBoardAdapter } from 'components/proposals/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { useUser } from 'hooks/useUser';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFields;
  onChange?: (values: ProposalFields) => void;
  readOnly?: boolean;
};

export function CustomPropertiesAdapter({ proposal, onChange, readOnly }: Props) {
  const { user } = useUser();
  const { board, card, cards, activeView, views, proposalPage } = useProposalsBoardAdapter({ proposal });
  const mutator = usePropertiesMutator({ proposal, onChange });

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
