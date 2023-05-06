import { useMemo } from 'react';

import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import { PageDialog } from 'components/common/PageDialog/PageDialog';
import { useBounties } from 'hooks/useBounties';

type Props = {
  cardId: string;
  onClose: () => void;
  readOnly: boolean;
};

function CardDialog(props: Props): JSX.Element | null {
  const { cardId, readOnly, onClose } = props;
  const { bounties } = useBounties();
  const bounty = useMemo(() => {
    return bounties.find((b) => b.page?.id === cardId) ?? null;
  }, [cardId, bounties.length]);

  return (
    <DocumentPageProviders>
      <PageDialog onClose={onClose} readOnly={readOnly} bounty={bounty} pageId={cardId} />
    </DocumentPageProviders>
  );
}
export default CardDialog;
