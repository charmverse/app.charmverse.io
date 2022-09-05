import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { addPage } from 'lib/pages/addPage';

export default function NewProposalButton () {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const { showPage } = usePageDialog();

  async function onClickCreate () {
    if (currentSpace && user) {
      const { page: newPage } = await addPage({
        spaceId: currentSpace.id,
        createdBy: user.id,
        type: 'proposal'
      });
      showPage({
        pageId: newPage.id
      });
    }
  }

  return (
    <Button onClick={onClickCreate}>
      Create Proposal
    </Button>
  );
}
