import { useState } from 'react';
import { Page } from '@prisma/client';
import Button from 'components/common/Button';
import { addPage } from 'lib/pages/addPage';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import PageDialog from './PageDialog';

interface CreatePageButtonProps {
  type: 'proposal' | 'bounty'
}

export default function CreatePageButton ({ type }: CreatePageButtonProps) {

  const [user] = useUser();
  const [currentSpace] = useCurrentSpace();
  const [page, setPage] = useState<Page | null>();

  async function onClickCreate () {
    if (currentSpace && user && type === 'proposal') {
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
        {type === 'proposal' ? 'Create Proposal' : 'Create Bounty'}
      </Button>
      {page && <PageDialog page={page} onClose={() => setPage(null)} />}
    </>
  );
}
