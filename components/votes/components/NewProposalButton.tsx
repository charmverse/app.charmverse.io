import Button from 'components/common/Button';
import PageDialog from 'components/common/PageDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { IPageWithPermissions } from 'lib/pages';
import { addPage } from 'lib/pages/addPage';
import { useState } from 'react';

export default function NewProposalButton () {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const [page, setPage] = useState<IPageWithPermissions | null>(null);

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
      {page && <PageDialog page={page} onClose={() => setPage(null)} />}
    </>
  );
}
