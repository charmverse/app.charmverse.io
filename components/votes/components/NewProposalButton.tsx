import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { addPage } from 'lib/pages/addPage';
import { usePages } from 'hooks/usePages';
import { KeyedMutator } from 'swr';
import { ProposalWithUsers } from 'lib/proposal/interface';

export default function NewProposalButton ({ mutateProposals }: {mutateProposals: KeyedMutator<ProposalWithUsers[]>}) {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const { showPage } = usePageDialog();
  const { setPages } = usePages();

  async function onClickCreate () {
    if (currentSpace && user) {
      const { page: newPage } = await addPage({
        spaceId: currentSpace.id,
        createdBy: user.id,
        type: 'proposal'
      });

      setPages(pages => ({
        ...pages,
        [newPage.id]: newPage
      }));

      mutateProposals();
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
