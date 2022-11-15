import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';
import log from 'lib/log';
import type { IPageWithPermissions } from 'lib/pages/interfaces';

import { usePageDialog } from './hooks/usePageDialog';
import PageDialog from './PageDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function PageDialogGlobal () {
  const [page, setPage] = useState<IPageWithPermissions | null>(null);
  const { bounties } = useBounties();
  const { props, hidePage } = usePageDialog();
  const { bountyId, hideToolsMenu, pageId, readOnly, toolbar } = props;

  // look up bounty by pageId or bountyId
  const bounty = bounties.find(b => b.id === bountyId || b.page.id === pageId);
  const pageIdToFetch = bounty?.page.id || (pageId as string);

  function closeDialog () {
    hidePage(page);
  }

  useEffect(() => {
    if (pageIdToFetch) {
      charmClient.pages.getPage(pageIdToFetch)
        .then(_page => {
          setPage(_page);
        })
        .catch(error => {
          log.error('Could not load page', error);
        });
    }
    else {
      setPage(null);
    }
  }, [pageIdToFetch]);

  return (
    <PageDialog
      setGlobalPage={(pageMeta) => {
        if (pageMeta && page) {
          setPage({ ...page, title: pageMeta.title, hasContent: pageMeta.hasContent });
        }
      }}
      bounty={bounty}
      hideToolsMenu={hideToolsMenu}
      readOnly={readOnly}
      toolbar={toolbar}
      page={page}
      onClose={closeDialog}
    />
  );
}
