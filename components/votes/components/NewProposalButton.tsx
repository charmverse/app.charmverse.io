import { Page } from '@prisma/client';
import Button from 'components/common/Button';
import PageDialog from 'components/common/Page/PageDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useUser } from 'hooks/useUser';
import { addPage } from 'lib/pages/addPage';
import { usePages } from 'hooks/usePages';
import { useState } from 'react';
import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';

export default function NewProposalButton () {
  const [user] = useUser();
  const { pages, setPages } = usePages();
  const [currentSpace] = useCurrentSpace();
  const [currentSpacePermissions] = useCurrentSpacePermissions();
  const [page, setPage] = useState<Page | null>(null);
  const { showMessage } = useSnackbar();

  async function onClickCreate () {
    if (currentSpace && user) {
      charmClient.createProposal({
        spaceId: currentSpace.id
      }).then(_page => {
        setPages({
          ...pages,
          [_page.id]: _page
        });
        setPage(_page);
      })
        .catch(err => {
          showMessage(err?.message ?? 'Error creating proposal', 'error');
        });
    }
  }

  if (!currentSpacePermissions?.createPage) {
    return null;
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
