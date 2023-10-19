import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import { PageDialog } from 'components/common/PageDialog/PageDialog';

type Props = {
  cardId: string;
  onClose: () => void;
  readOnly: boolean;
};

function CardDialog(props: Props): JSX.Element | null {
  const { cardId, readOnly, onClose } = props;

  return (
    <DocumentPageProviders isInsideDialog={true}>
      <PageDialog onClose={onClose} readOnly={readOnly} pageId={cardId} />
    </DocumentPageProviders>
  );
}
export default CardDialog;
