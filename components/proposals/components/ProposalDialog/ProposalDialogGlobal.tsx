import type { Page } from '@charmverse/core/src/prisma-client';
import log from 'loglevel';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import type { PageWithContent } from 'lib/pages';

import { useProposalDialog } from './hooks/useProposalDialog';
import { ProposalDialog } from './ProposalDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function ProposalDialogGlobal() {
  const { props, hideProposal } = useProposalDialog();
  const { newProposal, pageId } = props;
  const [page, setPage] = useState<PageWithContent | null>(null);

  useEffect(() => {
    if (pageId) {
      charmClient.pages
        .getPage(pageId)
        .then((_page) => {
          setPage(_page);
        })
        .catch((error) => {
          log.error('Could not load page', error);
        });
    } else {
      setPage(null);
    }
  }, [pageId]);

  if (newProposal || page || pageId) {
    return <ProposalDialog isLoading={false} onClose={hideProposal} page={page} />;
  }
  return null;
}
