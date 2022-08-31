import Button from 'components/common/Button';
import PageDialog from 'components/common/Page/PageDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { IPageWithPermissions } from 'lib/pages';
import { addPage } from 'lib/pages/addPage';
import { useState } from 'react';

export default function NewProposalButton () {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const [page, setPage] = useState<IPageWithPermissions | null>(null);

  const { refreshPage: refresh } = usePages();

  async function refreshPage () {
    if (page) {
      const refreshedPage = await refresh(page.id);
      setPage(refreshedPage);
    }
  }

  async function onClickCreate () {
    if (currentSpace && user) {
      const { page: newPage } = await addPage({
        spaceId: currentSpace.id,
        createdBy: user.id,
        type: 'proposal'
      });
      setPage(newPage);
    }
  }

  return (
    <>
      <Button onClick={onClickCreate}>
        Create Proposal
      </Button>
      {page && <PageDialog page={page} refreshPage={refreshPage} onClose={() => setPage(null)} />}
    </>
  );
}
