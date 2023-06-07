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
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  useEffect(() => {
    if (pageId) {
      setIsLoadingPage(true);
      charmClient.pages
        .getPage(pageId)
        .then((_page) => {
          setPage(_page);
        })
        .catch((error) => {
          log.error('Could not load page', error);
        })
        .finally(() => {
          setIsLoadingPage(false);
        });
    } else {
      setPage(null);
    }
  }, [pageId]);

  if (newProposal || page || pageId) {
    return <ProposalDialog isLoading={isLoadingPage} onClose={hideProposal} page={page} />;
  }
  return null;
}
