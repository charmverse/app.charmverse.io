import { useMemo } from 'react';

import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import PageDialog from 'components/common/PageDialog';
import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';

import { getCard } from '../store/cards';
import { useAppSelector } from '../store/hooks';

type Props = {
  cardId: string;
  onClose: () => void;
  readOnly: boolean;
};

function CardDialog(props: Props): JSX.Element | null {
  const { cardId, readOnly, onClose } = props;
  const card = useAppSelector(getCard(cardId));
  const { pages } = usePages();
  const { bounties } = useBounties();
  const cardPage = pages[cardId];
  const bounty = useMemo(() => {
    return bounties.find((b) => b.page?.id === cardId) ?? null;
  }, [cardId, bounties.length]);

  return card && pages[card.id] ? (
    <DocumentPageProviders>
      <PageDialog onClose={onClose} readOnly={readOnly} bounty={bounty} page={cardPage} />
    </DocumentPageProviders>
  ) : null;
}
export default CardDialog;
