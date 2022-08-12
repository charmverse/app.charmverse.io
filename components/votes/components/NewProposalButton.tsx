import { Page } from '@prisma/client';
import Button from 'components/common/Button';
import PageDialog from 'components/common/Page/PageDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { addPage } from 'lib/pages/addPage';
import { useState } from 'react';

export default function NewProposalButton () {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const [page, setPage] = useState<Page | null>(null);

  async function onClickCreate () {
    if (currentSpace && user) {
      const newPage = await addPage({
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
